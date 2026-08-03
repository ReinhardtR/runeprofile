import { Camera, Matrix4, Mesh, Object3D, Vector3 } from "three";

/**
 * Sorts the triangles of translucent meshes back to front, per mesh, in that
 * mesh's own space.
 *
 * The game draws models painter style, so a surface always covers whatever was
 * drawn before it. A GPU renders the triangles of a mesh in index order
 * regardless of depth, and three sorts objects against each other but never the
 * triangles inside one. Without reordering, a near face can be drawn before a
 * far one, which reads as geometry poking through a surface rather than sitting
 * behind it.
 *
 * Only translucent meshes need it. Opaque geometry is depth tested, so the GPU
 * resolves what covers what per pixel regardless of the order triangles arrive
 * in.
 *
 * The direction is resolved into each mesh's local space rather than compared
 * in world space, so rotating the model re-sorts exactly like orbiting the
 * camera does. Comparing world direction alone leaves a spinning model with
 * stale ordering, which is when the artefacts are worst.
 */
export class DepthSorter {
  private readonly meshes: SortableMesh[] = [];

  constructor(root: Object3D) {
    root.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      if (!materials.some((material) => material.transparent)) {
        return;
      }

      const sortable = SortableMesh.from(object);
      if (sortable) {
        this.meshes.push(sortable);
      }
    });
  }

  get isEmpty(): boolean {
    return this.meshes.length === 0;
  }

  get meshCount(): number {
    return this.meshes.length;
  }

  /**
   * Counts triangle pairs drawn in the wrong depth order. Zero means correctly
   * sorted; anything else is a bug in here rather than a limit of the approach.
   *
   * Worth keeping reachable rather than trimming as dead code. Sorting looks
   * obviously correct while being wrong in ways that only show as flickering
   * once the camera moves, and reasoning about it repeatedly reached the wrong
   * conclusion; counting inversions found the real fault in one go.
   */
  countInversions(camera: Camera): number {
    camera.getWorldDirection(worldDirection);
    return this.meshes.reduce(
      (total, mesh) => total + mesh.countInversions(worldDirection),
      0,
    );
  }

  /**
   * Re-sorts any mesh whose view direction has moved meaningfully. Returns true
   * when index buffers were rewritten, so the caller knows to redraw.
   */
  update(camera: Camera): boolean {
    if (this.meshes.length === 0) {
      return false;
    }

    camera.getWorldDirection(worldDirection);
    let resorted = false;
    for (const mesh of this.meshes) {
      resorted = mesh.updateFor(worldDirection) || resorted;
    }
    return resorted;
  }
}

const worldDirection = new Vector3();
const localDirection = new Vector3();
const inverseWorld = new Matrix4();

/**
 * Re-sort unless the view is essentially unchanged, about a quarter of a degree.
 *
 * A looser threshold looks like a saving and is not: the order then holds for
 * several frames of a moving camera and snaps when it finally updates, and that
 * snap shows up as flickering across polygon edges. Sorting a few hundred
 * translucent triangles costs far less than the popping does, and a still
 * camera still does no work at all.
 */
const RESORT_THRESHOLD = 0.99999;

class SortableMesh {
  private readonly lastDirection = new Vector3();
  private sorted = false;

  private constructor(
    private readonly mesh: Mesh,
    /** The live index buffer, rewritten on every sort. */
    private readonly indices: Uint32Array | Uint16Array,
    /**
     * The index buffer as it was loaded, never mutated.
     *
     * Sorting has to read from this rather than from the live buffer. Centroids
     * are computed once and stay indexed by a triangle's original position, so
     * building the new order out of an already permuted buffer pairs each slot
     * with the wrong centroid: the first sort is right and every one after it
     * compounds the previous permutation into noise.
     */
    private readonly original: Uint32Array | Uint16Array,
    private readonly positions: ArrayLike<number>,
    private readonly centroids: Float32Array,
    private readonly depths: Float32Array,
    private readonly order: number[],
  ) {}

  static from(mesh: Mesh): SortableMesh | null {
    const index = mesh.geometry.getIndex();
    const position = mesh.geometry.getAttribute("position");
    if (!index || !position) {
      return null;
    }

    const triangles = index.count / 3;
    const indices = index.array as Uint32Array | Uint16Array;
    const centroids = new Float32Array(triangles * 3);

    for (let t = 0; t < triangles; t++) {
      for (let axis = 0; axis < 3; axis++) {
        centroids[t * 3 + axis] =
          (position.array[indices[t * 3]! * 3 + axis]! +
            position.array[indices[t * 3 + 1]! * 3 + axis]! +
            position.array[indices[t * 3 + 2]! * 3 + axis]!) /
          3;
      }
    }

    return new SortableMesh(
      mesh,
      indices,
      indices.slice(),
      position.array,
      centroids,
      new Float32Array(triangles),
      Array.from({ length: triangles }, (_, i) => i),
    );
  }

  /** Diagnostics: adjacent triangles this mesh draws in the wrong order. */
  countInversions(worldDir: Vector3): number {
    const local = this.localDirection(worldDir);
    let inversions = 0;
    let previous = Number.POSITIVE_INFINITY;
    for (let slot = 0; slot < this.depths.length; slot++) {
      const depth = this.depthOfSlot(slot, local);
      if (depth > previous + 1e-5) {
        inversions++;
      }
      previous = depth;
    }
    return inversions;
  }

  /** Depth of the triangle currently occupying a slot in the index buffer. */
  private depthOfSlot(slot: number, local: Vector3): number {
    let x = 0;
    let y = 0;
    let z = 0;
    for (let corner = 0; corner < 3; corner++) {
      const at = this.indices[slot * 3 + corner]! * 3;
      x += this.positions[at]!;
      y += this.positions[at + 1]!;
      z += this.positions[at + 2]!;
    }
    return (x * local.x + y * local.y + z * local.z) / 3;
  }

  private localDirection(worldDir: Vector3): Vector3 {
    this.mesh.updateWorldMatrix(true, false);
    inverseWorld.copy(this.mesh.matrixWorld).invert();
    return localDirection.copy(worldDir).transformDirection(inverseWorld);
  }

  /** Sorts if this mesh's view direction, in its own space, has moved enough. */
  updateFor(worldDir: Vector3): boolean {
    const localDirection = this.localDirection(worldDir);

    if (
      this.sorted &&
      localDirection.dot(this.lastDirection) > RESORT_THRESHOLD
    ) {
      return false;
    }
    this.lastDirection.copy(localDirection);
    this.sorted = true;

    const triangles = this.depths.length;
    for (let t = 0; t < triangles; t++) {
      this.depths[t] =
        this.centroids[t * 3]! * localDirection.x +
        this.centroids[t * 3 + 1]! * localDirection.y +
        this.centroids[t * 3 + 2]! * localDirection.z;
      this.order[t] = t;
    }

    // Further along the direction the camera looks means further away, so
    // descending order draws the furthest triangle first.
    this.order.sort((a, b) => this.depths[b]! - this.depths[a]!);

    for (let slot = 0; slot < triangles; slot++) {
      const from = this.order[slot]! * 3;
      this.indices[slot * 3] = this.original[from]!;
      this.indices[slot * 3 + 1] = this.original[from + 1]!;
      this.indices[slot * 3 + 2] = this.original[from + 2]!;
    }

    this.mesh.geometry.getIndex()!.needsUpdate = true;
    return true;
  }
}
