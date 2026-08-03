import { type LoadedModel, loadModel } from "@runeprofile/model-renderer";

import defaultModelUrl from "~/core/assets/default-player-model.glb?url";

/**
 * The model shown when a character's own cannot be loaded: a plain unequipped
 * character in a standing pose, so it reads as "we do not know what this one
 * looks like" rather than as somebody's real profile.
 *
 * Lives here rather than in the renderer package because it is a policy of this
 * app, and because it needs a bundled asset.
 *
 * Fetched rather than inlined: as base64 in a JSON module it cost a third more
 * bytes, sat in the JS bundle, and was decoded on every page load instead of
 * being cached by the browser as a file.
 *
 * The fetch is shared, because a group page whose members all fail would
 * otherwise ask for the same file once per member.
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
