import { parseGlb } from "./glb";
import { parsePly } from "./ply";
import type { ParsedModel } from "./ply";
import { renderScene } from "./rasterizer";
import type { ModelInstance, RenderOptions } from "./rasterizer";
import { encodePng } from "./png";

export { parseGlb } from "./glb";
export { parsePly } from "./ply";
export type { ParsedModel } from "./ply";
export { renderScene } from "./rasterizer";
export type { ModelInstance, RenderOptions } from "./rasterizer";
export { encodePng } from "./png";

/** "glTF" — the first four bytes of every binary glTF file. */
const GLB_MAGIC = 0x46546c67;

/**
 * Parses a plugin-exported model in whichever format the profile holds:
 * GLB is what the plugin uploads now, PLY is whatever a profile last
 * synced before the switch. Decided by the leading bytes, same as the
 * site's loader.
 */
export function parseModel(data: ArrayBuffer | Uint8Array): ParsedModel {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.length >= 4) {
    const magic =
      bytes[0]! | (bytes[1]! << 8) | (bytes[2]! << 16) | (bytes[3]! << 24);
    if ((magic >>> 0) === GLB_MAGIC) {
      return parseGlb(bytes);
    }
  }
  return parsePly(bytes);
}

/** Renders a single model (GLB or PLY) straight to a PNG. */
export async function renderModelToPng(
  model: ArrayBuffer | Uint8Array,
  options: RenderOptions & Omit<ModelInstance, "model">,
): Promise<Uint8Array> {
  const { yaw, offsetX, offsetZ, ...renderOptions } = options;
  const parsed = parseModel(model);
  const rgba = renderScene(
    [{ model: parsed, yaw, offsetX, offsetZ }],
    renderOptions,
  );
  return encodePng(rgba, renderOptions.width, renderOptions.height);
}

/** Renders a multi-model scene (e.g. group members side by side) to a PNG. */
export async function renderSceneToPng(
  instances: ModelInstance[],
  options: RenderOptions,
): Promise<Uint8Array> {
  const rgba = renderScene(instances, options);
  return encodePng(rgba, options.width, options.height);
}
