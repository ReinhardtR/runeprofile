import { z } from "zod";

/**
 * An abuse guard, not a working limit. Measured: 70 KB a player, 90 KB a pet,
 * 128 KB the largest real model seen. Textures barely move it - each is at most
 * 128x128 - so this is roughly 4x a pessimistic future model.
 */
export const MAX_MODEL_BYTES = 512 * 1024;

/** The formats a plugin may upload, by file extension. */
export const MODEL_EXTENSIONS = [".glb", ".ply"] as const;

/**
 * GLB is what the plugin sends now; PLY stays accepted because older plugin
 * versions still upload it. Readers tell them apart by their magic bytes, so
 * there is nothing to migrate.
 */
export const modelFileSchema = z
  .instanceof(File)
  .refine(
    (file) => file.size > 0 && file.size <= MAX_MODEL_BYTES,
    "Invalid file size",
  )
  .refine(
    (file) => MODEL_EXTENSIONS.some((ext) => file.name.endsWith(ext)),
    "Invalid file type",
  );

/** Recorded as R2 metadata so reads can set a header without inspecting bytes. */
export function modelContentType(fileName: string): string {
  return fileName.endsWith(".glb") ? "model/gltf-binary" : "model/ply";
}
