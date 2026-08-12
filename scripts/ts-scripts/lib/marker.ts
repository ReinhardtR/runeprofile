import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { createR2Client, r2Bucket } from "./r2";

// Shared "last processed X" marker object stored in the R2 bucket, used by
// the game-data pipeline's independent check-*-cache gates so each can
// track its own progress (see check-cache-version.ts and
// check-data-cache.ts) without stepping on the other's marker key.

const s3 = createR2Client();
const bucket = r2Bucket();

export async function readMarker(
  key: string,
): Promise<Record<string, unknown> | null> {
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const body = await response.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch (error) {
    if ((error as { name?: string }).name === "NoSuchKey") {
      return null;
    }
    throw error;
  }
}

export async function writeMarker(
  key: string,
  value: Record<string, unknown>,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify({ ...value, processedAt: new Date().toISOString() }),
      ContentType: "application/json",
    }),
  );
}
