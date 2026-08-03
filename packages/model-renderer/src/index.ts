/**
 * Everything needed to put a plugin-exported character model on screen.
 *
 * Shared because there are two consumers and they must agree: the website, and
 * the viewer under tools/model-viewer that is used to check it. While the viewer
 * had its own copy the two drifted - it rendered vertex colours pass-through
 * while the site decoded them - and that divergence is exactly what made a real
 * colour bug look like a difference of opinion between two tools.
 *
 * Deliberately free of anything app-specific: no fallback model, no camera, no
 * layout. It turns bytes into an Object3D positioned in the exporter's
 * coordinates, and gives you the per-frame work that model needs.
 */
export {
  type LoadedModel,
  type ModelFormat,
  disposeModel,
  loadModel,
} from "./load-model";
export { ModelAnimator } from "./animate-model";
export { DepthSorter } from "./depth-sort";
export { applyPriorityOffsets } from "./priority-offset";
export { type ScrollingTexture, collectScrollingTextures } from "./texture-scroll";
