import { type LoadedModel, loadModel } from "@runeprofile/model-renderer";

import defaultModelUrl from "~/core/assets/default-player-model.glb?url";

/**
 * The model shown when a character's own cannot be loaded.
 */
let defaultModelBytes: Promise<ArrayBuffer> | undefined;

export async function loadDefaultModel(): Promise<LoadedModel> {
  defaultModelBytes ??= fetch(defaultModelUrl).then((response) => {
    if (!response.ok) {
      // Cleared so a later attempt can retry rather than reusing the failure.
      defaultModelBytes = undefined;
      throw new Error("Could not load the default model");
    }
    return response.arrayBuffer();
  });
  return loadModel(await defaultModelBytes);
}
