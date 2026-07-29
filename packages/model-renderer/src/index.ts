import { parsePly } from "./ply";
import { renderScene } from "./rasterizer";
import type { ModelInstance, RenderOptions } from "./rasterizer";
import { encodePng } from "./png";

export { parsePly } from "./ply";
export type { ParsedModel } from "./ply";
export { renderScene } from "./rasterizer";
export type { ModelInstance, RenderOptions } from "./rasterizer";
export { encodePng } from "./png";

/** Renders a single PLY model straight to a PNG. */
export async function renderPlyToPng(
  ply: ArrayBuffer | Uint8Array,
  options: RenderOptions & Omit<ModelInstance, "model">,
): Promise<Uint8Array> {
  const { yaw, offsetX, offsetZ, ...renderOptions } = options;
  const model = parsePly(ply);
  const rgba = renderScene([{ model, yaw, offsetX, offsetZ }], renderOptions);
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
