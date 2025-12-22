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
    await Promise.all([
      renameFile(bucket, oldPlayerKey, newPlayerKey),
      renameFile(
        bucket,
        createPetModelKey(oldUsername),
        createPetModelKey(newUsername),
      ),
    ]);
  } catch (error) {
    console.error("Failed to rename player models:", error);
    throw error;
  }
}

async function renameFile(bucket: R2Bucket, oldKey: string, newKey: string) {
  const file = await bucket.get(oldKey);
  if (!file) return;
  const data = await file.arrayBuffer();
  await bucket.put(newKey, data);
  await bucket.delete(oldKey);
}
