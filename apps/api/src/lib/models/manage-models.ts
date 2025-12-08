/**
 * Helper functions for managing player model files in R2 storage
 */
import { createPetModelKey, createPlayerModelKey } from "~/lib/models/keys";

export async function uploadPlayerModels(
  bucket: R2Bucket,
  username: string,
  playerModel: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
  petModel?: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
): Promise<void> {
  try {
    await bucket.put(createPlayerModelKey(username), playerModel);
  } catch (error) {
    console.error("Failed to upload player model:", error);
    throw error;
  }

  if (petModel) {
    try {
      await bucket.put(createPetModelKey(username), petModel);
    } catch (error) {
      console.error("Failed to upload pet model:", error);
      throw error;
    }
  } else {
    // If no pet model provided, delete any existing pet model
    try {
      await bucket.delete(createPetModelKey(username));
    } catch (error) {
      console.error("Failed to delete pet model:", error);
      throw error;
    }
  }
}

export async function deletePlayerModels(
  bucket: R2Bucket,
  username: string,
): Promise<void> {
  try {
    await Promise.all([
      bucket.delete(createPlayerModelKey(username)),
      bucket.delete(createPetModelKey(username)),
    ]);
  } catch (error) {
    console.error("Failed to delete player models:", error);
    throw error;
  }
}

export async function renamePlayerModels(
  bucket: R2Bucket,
  oldUsername: string,
  newUsername: string,
): Promise<void> {
  const oldPlayerKey = createPlayerModelKey(oldUsername);
  const newPlayerKey = createPlayerModelKey(newUsername);

  // If usernames are the same (case-insensitive), no need to rename
  if (oldPlayerKey === newPlayerKey) {
    return;
  }

  try {
    // Get existing models
    const [playerModel, petModel] = await Promise.all([
      bucket.get(oldPlayerKey),
      bucket.get(createPetModelKey(oldUsername)),
    ]);

    const operations: Promise<R2Object | void | null>[] = [];

    // Copy player model to new key and delete old one
    if (playerModel) {
      operations.push(bucket.put(newPlayerKey, playerModel.body));
      operations.push(bucket.delete(oldPlayerKey));
    }

    // Copy pet model to new key and delete old one
    if (petModel) {
      operations.push(
        bucket.put(createPetModelKey(newUsername), petModel.body),
      );
      operations.push(bucket.delete(createPetModelKey(oldUsername)));
    }

    if (operations.length > 0) {
      await Promise.all(operations);
    }
  } catch (error) {
    console.error("Failed to rename player models:", error);
    throw error;
  }
}
