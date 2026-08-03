import type { ParsedModel } from "./ply";

/**
 * Parses the binary glTF models the plugin uploads into the flat
 * vertex-color triangle soup the rasterizer consumes.
 *
 * Faithful to geometry and vertex colors; deliberately not to materials:
 * textures and per-face translucency (which the site's three.js renderer
 * does honor) are approximated — textured faces fall back to their vertex
 * color or the material's base color factor, and mostly-transparent faces
 * are dropped rather than blended.
 *
 * Output is in the same coordinate space parsePly produces, so everything
 * downstream (yaw conventions, body framing) applies unchanged. The
 * exporter writes game space as (x, -y, -z) where the PLY writer emitted
 * (x, z, -y) — a quarter turn about X apart — and scales its root node by
 * 1/128 to keep vertex integers exact. Both are undone here.
 */
export function parseGlb(data: ArrayBuffer | Uint8Array): ParsedModel {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error("Invalid GLB: bad magic");
  }

  // Chunk walk: JSON first, then (optionally) BIN.
  let offset = 12;
  let json: GltfDocument | null = null;
  let bin: Uint8Array | null = null;
  while (offset + 8 <= bytes.length) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunk = bytes.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === CHUNK_JSON) {
      json = JSON.parse(new TextDecoder().decode(chunk)) as GltfDocument;
    } else if (chunkType === CHUNK_BIN) {
      bin = chunk;
    }
    offset += 8 + chunkLength + ((4 - (chunkLength % 4)) % 4);
  }
  if (!json) {
    throw new Error("Invalid GLB: missing JSON chunk");
  }

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const doc = new GltfReader(json, bin);
  const scene = json.scenes?.[json.scene ?? 0];
  for (const nodeIndex of scene?.nodes ?? []) {
    visitNode(doc, nodeIndex, IDENTITY, positions, colors, indices);
  }

  return {
    positions: Int16Array.from(positions, (v) => Math.round(v)),
    colors: Uint8Array.from(colors),
    indices: Uint32Array.from(indices),
  };
}

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"
const CHUNK_BIN = 0x004e4942; // "BIN\0"

/** Game units per glTF unit — the exporter's root-node scale, undone. */
const GAME_UNITS_PER_GLTF_UNIT = 128;

/** Faces this transparent are dropped instead of drawn opaque. */
const ALPHA_CUTOFF = 0.5;

type GltfDocument = {
  scene?: number;
  scenes?: { nodes?: number[] }[];
  nodes?: {
    children?: number[];
    mesh?: number;
    matrix?: number[];
    translation?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
  }[];
  meshes?: {
    primitives: {
      attributes: Record<string, number>;
      indices?: number;
      material?: number;
      mode?: number;
    }[];
  }[];
  materials?: {
    pbrMetallicRoughness?: { baseColorFactor?: number[] };
  }[];
  accessors?: {
    bufferView?: number;
    byteOffset?: number;
    componentType: number;
    normalized?: boolean;
    count: number;
    type: string;
  }[];
  bufferViews?: {
    buffer: number;
    byteOffset?: number;
    byteLength: number;
    byteStride?: number;
  }[];
};

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const COMPONENTS_PER_TYPE: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
};

class GltfReader {
  constructor(
    readonly json: GltfDocument,
    readonly bin: Uint8Array | null,
  ) {}

  /**
   * Reads an accessor into numbers. Normalized integer types come back in
   * 0..1 (or -1..1), floats as-is.
   */
  readAccessor(index: number): { values: Float32Array; components: number } {
    const accessor = this.json.accessors?.[index];
    if (!accessor) throw new Error(`Invalid GLB: missing accessor ${index}`);
    const components = COMPONENTS_PER_TYPE[accessor.type] ?? 1;
    const values = new Float32Array(accessor.count * components);

    const bufferView =
      accessor.bufferView != null
        ? this.json.bufferViews?.[accessor.bufferView]
        : undefined;
    if (!bufferView || !this.bin) return { values, components };

    const componentSize = COMPONENT_SIZES[accessor.componentType] ?? 4;
    const stride = bufferView.byteStride ?? components * componentSize;
    const base =
      this.bin.byteOffset +
      (bufferView.byteOffset ?? 0) +
      (accessor.byteOffset ?? 0);
    const view = new DataView(this.bin.buffer);

    for (let i = 0; i < accessor.count; i++) {
      for (let c = 0; c < components; c++) {
        const at = base + i * stride + c * componentSize;
        values[i * components + c] = readComponent(
          view,
          at,
          accessor.componentType,
          accessor.normalized ?? false,
        );
      }
    }
    return { values, components };
  }
}

const COMPONENT_SIZES: Record<number, number> = {
  5120: 1, // byte
  5121: 1, // unsigned byte
  5122: 2, // short
  5123: 2, // unsigned short
  5125: 4, // unsigned int
  5126: 4, // float
};

function readComponent(
  view: DataView,
  at: number,
  componentType: number,
  normalized: boolean,
): number {
  switch (componentType) {
    case 5120:
      return normalized
        ? Math.max(view.getInt8(at) / 127, -1)
        : view.getInt8(at);
    case 5121:
      return normalized ? view.getUint8(at) / 255 : view.getUint8(at);
    case 5122:
      return normalized
        ? Math.max(view.getInt16(at, true) / 32767, -1)
        : view.getInt16(at, true);
    case 5123:
      return normalized
        ? view.getUint16(at, true) / 65535
        : view.getUint16(at, true);
    case 5125:
      return view.getUint32(at, true);
    case 5126:
      return view.getFloat32(at, true);
    default:
      return 0;
  }
}

function visitNode(
  doc: GltfReader,
  nodeIndex: number,
  parent: number[],
  positions: number[],
  colors: number[],
  indices: number[],
): void {
  const node = doc.json.nodes?.[nodeIndex];
  if (!node) return;

  const world = multiply(parent, nodeMatrix(node));

  if (node.mesh != null) {
    const mesh = doc.json.meshes?.[node.mesh];
    for (const primitive of mesh?.primitives ?? []) {
      // Only triangles (the default mode) — the exporter emits nothing else.
      if (primitive.mode != null && primitive.mode !== 4) continue;
      appendPrimitive(doc, primitive, world, positions, colors, indices);
    }
  }

  for (const child of node.children ?? []) {
    visitNode(doc, child, world, positions, colors, indices);
  }
}

function appendPrimitive(
  doc: GltfReader,
  primitive: {
    attributes: Record<string, number>;
    indices?: number;
    material?: number;
  },
  world: number[],
  positions: number[],
  colors: number[],
  indices: number[],
): void {
  const positionAccessor = primitive.attributes["POSITION"];
  if (positionAccessor == null) return;
  const position = doc.readAccessor(positionAccessor);
  const vertexCount = position.values.length / position.components;

  const colorAccessor = primitive.attributes["COLOR_0"];
  const color = colorAccessor != null ? doc.readAccessor(colorAccessor) : null;

  // Untinted textured faces have no COLOR_0; fall back to the material's
  // base color factor so they at least carry their average tone.
  const factor = doc.json.materials?.[primitive.material ?? -1]
    ?.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1];

  const vertexBase = positions.length / 3;
  const alphas = new Float32Array(vertexCount);

  for (let i = 0; i < vertexCount; i++) {
    const x = position.values[i * 3]!;
    const y = position.values[i * 3 + 1]!;
    const z = position.values[i * 3 + 2]!;

    // Node transform into glTF world space...
    const wx = world[0]! * x + world[4]! * y + world[8]! * z + world[12]!;
    const wy = world[1]! * x + world[5]! * y + world[9]! * z + world[13]!;
    const wz = world[2]! * x + world[6]! * y + world[10]! * z + world[14]!;

    // ...then a quarter turn about X into PLY space, back in game units.
    positions.push(
      wx * GAME_UNITS_PER_GLTF_UNIT,
      -wz * GAME_UNITS_PER_GLTF_UNIT,
      wy * GAME_UNITS_PER_GLTF_UNIT,
    );

    let r = factor[0] ?? 1;
    let g = factor[1] ?? 1;
    let b = factor[2] ?? 1;
    let a = factor[3] ?? 1;
    if (color) {
      r = color.values[i * color.components]!;
      g = color.values[i * color.components + 1]!;
      b = color.values[i * color.components + 2]!;
      if (color.components === 4) a = color.values[i * color.components + 3]!;
    }
    // The plugin writes sRGB bytes into COLOR_0 (the site's loader decodes
    // them to linear for three's pipeline, which re-encodes on output) —
    // for a PNG they can pass straight through, exactly like PLY colors.
    colors.push(
      Math.round(Math.min(1, Math.max(0, r)) * 255),
      Math.round(Math.min(1, Math.max(0, g)) * 255),
      Math.round(Math.min(1, Math.max(0, b)) * 255),
    );
    alphas[i] = a;
  }

  const faceIndices =
    primitive.indices != null
      ? doc.readAccessor(primitive.indices).values
      : Float32Array.from({ length: vertexCount }, (_, i) => i);

  for (let f = 0; f + 2 < faceIndices.length; f += 3) {
    const a = faceIndices[f]!;
    const b = faceIndices[f + 1]!;
    const c = faceIndices[f + 2]!;
    // The rasterizer has a z-buffer, not an alpha blender: drop faces that
    // are mostly transparent instead of drawing them opaque.
    const alpha = (alphas[a]! + alphas[b]! + alphas[c]!) / 3;
    if (alpha < ALPHA_CUTOFF) continue;
    indices.push(vertexBase + a, vertexBase + b, vertexBase + c);
  }
}

function nodeMatrix(node: {
  matrix?: number[];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
}): number[] {
  if (node.matrix) return node.matrix;

  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [qx, qy, qz, qw] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];

  // Column-major TRS, the glTF convention.
  const x2 = qx + qx;
  const y2 = qy + qy;
  const z2 = qz + qz;
  const xx = qx * x2;
  const xy = qx * y2;
  const xz = qx * z2;
  const yy = qy * y2;
  const yz = qy * z2;
  const zz = qz * z2;
  const wx = qw * x2;
  const wy = qw * y2;
  const wz = qw * z2;

  return [
    (1 - (yy + zz)) * sx,
    (xy + wz) * sx,
    (xz - wy) * sx,
    0,
    (xy - wz) * sy,
    (1 - (xx + zz)) * sy,
    (yz + wx) * sy,
    0,
    (xz + wy) * sz,
    (yz - wx) * sz,
    (1 - (xx + yy)) * sz,
    0,
    tx,
    ty,
    tz,
    1,
  ];
}

/** Column-major 4x4 multiply: result = a * b. */
function multiply(a: number[], b: number[]): number[] {
  const out = new Array<number>(16).fill(0);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row]! * b[col * 4 + k]!;
      }
      out[col * 4 + row] = sum;
    }
  }
  return out;
}
