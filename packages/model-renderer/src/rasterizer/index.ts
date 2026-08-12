import { detectModelFormat } from "../format";
import { parseGlb } from "./glb";
import { parsePly } from "./ply";
import type { ParsedModel } from "./ply";
import { renderScene } from "./rasterizer";
import type { ModelInstance, RenderOptions } from "./rasterizer";
import { encodePng } from "./png";

export { type ModelFormat, detectModelFormat } from "../format";
export { parseGlb } from "./glb";
export { parsePly } from "./ply";
export type { ParsedModel } from "./ply";
export { renderScene, estimateBody } from "./rasterizer";
export type { ModelInstance, RenderOptions, BodyEstimate } from "./rasterizer";
export { encodePng } from "./png";

/**
 * Parses a plugin-exported model in whichever format the profile holds:
 * GLB is what the plugin uploads now, PLY is whatever a profile last
 * synced before the switch. Uses the same sniffing rule as loadModel.
 */
export function parseModel(data: ArrayBuffer | Uint8Array): ParsedModel {
  return detectModelFormat(data) === "glb" ? parseGlb(data) : parsePly(data);
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
