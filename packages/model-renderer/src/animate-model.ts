import { Camera, Object3D } from "three";

import { DepthSorter } from "./depth-sort";
import {
  type ScrollingTexture,
  collectScrollingTextures,
} from "./texture-scroll";

/**
 * The per-frame work a loaded model needs: keeping translucent triangles sorted
 * back to front, and scrolling the textures the game animates.
 *
 * Both are properties of a GLB. A PLY has no transparency and no textures, so
 * tracking one costs nothing and the caller does not have to care which format
 * it loaded.
 *
 * Sorting has to run after whatever moves the model each frame, because it works
 * from where the geometry actually ended up. A model that spins while its
 * triangle order stays put is exactly when the artefacts are worst.
 */
export class ModelAnimator {
  private sorters: DepthSorter[] = [];
  private textures: ScrollingTexture[] = [];

  /** Starts animating a model. Safe to call for every loaded model. */
  track(root: Object3D): void {
    const sorter = new DepthSorter(root);
    if (!sorter.isEmpty) {
      this.sorters.push(sorter);
    }
    this.textures.push(...collectScrollingTextures(root));
  }

  /** Drops every tracked model, for when the models on screen change. */
  clear(): void {
    this.sorters = [];
    this.textures = [];
  }

  /**
   * @param delta seconds to advance animated textures by; pass 0 to hold them
   *   still while sorting still follows the camera.
   */
  update(camera: Camera, delta: number): void {
    for (const sorter of this.sorters) {
      sorter.update(camera);
    }

    if (delta === 0) {
      return;
    }
    for (const { texture, scrollU, scrollV } of this.textures) {
      // Wrapped rather than left to grow: the offset loses float precision as it
      // climbs and the scroll visibly stutters.
      texture.offset.x = (texture.offset.x + scrollU * delta) % 1;
      texture.offset.y = (texture.offset.y + scrollV * delta) % 1;
    }
  }
}
