import {
  Color,
  FrontSide,
  Group,
  LinearSRGBColorSpace,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SRGBColorSpace,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";

import { applyPriorityOffsets } from "./priority-offset";

/**
 * Loads a player or pet model, in whichever format the profile happens to hold.
 *
 * GLB is what the plugin uploads now. It carries textures, per-face
 * transparency and face render priority, none of which PLY can express - a fire
 * cape is flat orange in a PLY and actually on fire in a GLB.
 *
 * PLY is still loaded because a profile keeps whatever it last synced. There is
 * no migration and no backfill: a profile that last synced before the switch
 * serves its PLY until its owner syncs again, which may be never. The format is
 * decided by sniffing the leading bytes rather than by anything the API records,
 * so this keeps working no matter what is in the bucket.
 *
 * Both formats come back positioned and scaled identically, so callers do not
 * need to know which they got.
 */
export type ModelFormat = "glb" | "ply";

export type LoadedModel = {
  object: Object3D;
  format: ModelFormat;
};

const gltfLoader = new GLTFLoader();
const plyLoader = new PLYLoader();
const scratchColor = new Color();

/** "glTF" - the first four bytes of every binary glTF file. */
const GLB_MAGIC = 0x46546c67;

export async function loadModel(buffer: ArrayBuffer): Promise<LoadedModel> {
  const format = detectFormat(buffer);

  return {
    format,
    object: format === "glb" ? await loadGlb(buffer) : loadPly(buffer),
  };
}

function detectFormat(buffer: ArrayBuffer): ModelFormat {
  if (buffer.byteLength >= 4) {
    const magic = new DataView(buffer).getUint32(0, true);
    if (magic === GLB_MAGIC) {
      return "glb";
    }
  }
  return "ply";
}

/**
 * How many game units the exporter puts in one glTF unit. The exporter scales
 * the root node by the reciprocal, keeping vertex positions exact small
 * integers; undoing it here hands callers raw game units, which is what the PLY
 * path has always given them.
 */
const GAME_UNITS_PER_GLTF_UNIT = 128;

async function loadGlb(buffer: ArrayBuffer): Promise<Object3D> {
  const gltf = await gltfLoader.parseAsync(buffer, "");

  gltf.scene.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }

    for (const material of materialsOf(object)) {
      // Back faces are culled everywhere, as the game does.
      //
      // On translucent geometry it stops a shell being drawn twice, where two
      // half transparent layers compound to about three quarters and swamp
      // whatever is behind. On opaque geometry it stops the two sides of a thin
      // surface - the feathers on a quiver's arrows - landing at effectively the
      // same depth and flickering against each other as the camera moves.
      material.side = FrontSide;

      // Opaque draws first and writes depth so it occludes correctly;
      // translucent draws after, testing depth but not writing it, so it never
      // hides another translucent surface. DepthSorter then orders translucent
      // triangles back to front so blending comes out right. Each part alone
      // looks like the fix and is not.
      if (material.transparent) {
        material.depthWrite = false;
      }
    }

    decodeVertexColors(object);
  });

  // Applied to every mesh, translucent included: the offset must not reorder
  // opaque geometry against translucent geometry that stayed put.
  applyPriorityOffsets(gltf.scene);

  // The exporter writes game space as (x, -y, -z) while the PLY writer emits
  // (x, z, -y). Both are proper rotations, so the two differ by a quarter turn
  // about X and nothing else - no mirroring, and the same handedness. Rotating
  // here puts a GLB exactly where a PLY sat, which is what lets every caller
  // keep the positions and rotations it already had.
  const normalised = new Group();
  normalised.rotation.x = Math.PI / 2;
  normalised.scale.setScalar(GAME_UNITS_PER_GLTF_UNIT);
  normalised.add(gltf.scene);

  // Wrapped once more so the transform above survives. Callers set position,
  // rotation and scale on whatever they are handed, which would otherwise
  // overwrite it.
  return wrap(normalised);
}

/**
 * Brings glTF vertex colours into the same space PLY ones arrive in.
 *
 * PLYLoader treats vertex colours as sRGB and decodes them into three's linear
 * working space, where GLTFLoader takes COLOR_0 to be linear already and leaves
 * it alone. Left alone the same bytes render brighter as a GLB than as a PLY.
 *
 * Decoding here rather than switching the canvas to pass-through keeps the
 * change off everything else drawn in the same scene, and comes out the same:
 * gamma is a power law, so multiplying colour by texel in linear space and
 * encoding once equals multiplying in display space, which is what the game
 * does.
 */
function decodeVertexColors(mesh: Mesh): void {
  const color = mesh.geometry.getAttribute("color");
  if (!color || decodedColors.has(color)) {
    return;
  }

  for (let i = 0; i < color.count; i++) {
    scratchColor
      .setRGB(color.getX(i), color.getY(i), color.getZ(i), SRGBColorSpace)
      .getRGB(scratchColor, LinearSRGBColorSpace);
    color.setXYZ(i, scratchColor.r, scratchColor.g, scratchColor.b);
  }
  color.needsUpdate = true;
  decodedColors.add(color);
}

/**
 * Which colour buffers have already been decoded, tracked by the buffer itself.
 *
 * It has to be the attribute, not the mesh and not the geometry. A model split by
 * texture or by translucency is one glTF mesh with several primitives, and
 * GLTFLoader caches accessors - so those primitives become separate meshes with
 * separate geometries that all point at the *same* BufferAttribute. Guarding per
 * geometry decoded the shared buffer once per primitive.
 *
 * Decoding twice crushes the midtones while barely touching the highlights: 160
 * renders as 90 and 100 as 32, but 250 only drops to 244. So a single-primitive
 * model came out pixel exact while a geared character came out nearly black -
 * which is why measuring the plain model could never have caught this, and why it
 * presented as a lighting fault.
 */
const decodedColors = new WeakSet<object>();

/**
 * The format profiles held before GLB. It carries no material of its own, so it
 * gets the unlit vertex colour setup that the glTF path gets from
 * KHR_materials_unlit, and renders exactly as it did before this module existed.
 */
function loadPly(buffer: ArrayBuffer): Object3D {
  const geometry = plyLoader.parse(buffer);
  geometry.computeBoundingBox();

  return wrap(
    new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true })),
  );
}

/** A transform-free parent, so callers own the outer transform outright. */
function wrap(child: Object3D): Object3D {
  const group = new Group();
  group.add(child);
  return group;
}

function materialsOf(mesh: Mesh): Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

/** Releases the GPU resources a loaded model holds. */
export function disposeModel(root: Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    object.geometry.dispose();
    for (const material of materialsOf(object)) {
      const map = (material as { map?: { dispose(): void } | null }).map;
      map?.dispose();
      material.dispose();
    }
  });
}
