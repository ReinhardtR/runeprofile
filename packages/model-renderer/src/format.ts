/**
 * Conventions shared by both halves of this package: the three.js loader
 * (`.`) and the software rasterizer (`./rasterizer`). The rasterizer is a
 * shadow implementation of the loader's contract — anything the exporter
 * changes lands here once so the two cannot drift apart.
 */

/** The formats a profile can hold: GLB since the exporter switch, PLY before. */
export type ModelFormat = "glb" | "ply";

/** "glTF" — the first four bytes of every binary glTF file. */
export const GLB_MAGIC = 0x46546c67;

/**
 * How many game units the exporter puts in one glTF unit. The exporter
 * scales the root node by the reciprocal, keeping vertex positions exact
 * small integers; undoing it hands consumers raw game units, which is what
 * the PLY path has always given them.
 */
export const GAME_UNITS_PER_GLTF_UNIT = 128;

/**
 * Decided by sniffing the leading bytes rather than by anything the API
 * records: a profile keeps whatever it last synced, with no migration and
 * no backfill, so this keeps working no matter what is in the bucket.
 */
export function detectModelFormat(data: ArrayBuffer | Uint8Array): ModelFormat {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.length >= 4) {
    const magic =
      (bytes[0]! | (bytes[1]! << 8) | (bytes[2]! << 16) | (bytes[3]! << 24)) >>>
      0;
    if (magic === GLB_MAGIC) {
      return "glb";
    }
  }
  return "ply";
}
