import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { appendFileSync } from "node:fs";

import { downloadCache, resolveLatestCache } from "./lib/openrs2";
import { createR2Client, r2Bucket } from "./lib/r2";

// Gate for the unified daily game-data pipeline: compares the newest live
// cache on OpenRS2 against the last one the pipeline processed (a marker
// object in the R2 bucket) so the daily run is a fast no-op unless Jagex
// shipped an update.
//
//   check-cache-version [--download <dir>] [--force]
//     Resolves the latest cache and reports whether it's new. With
//     --download, also downloads + extracts it (only when new/forced) and
//     reports the extracted cache dir. When run inside GitHub Actions,
//     writes `new`, `cache_id` and `cache_dir` to GITHUB_OUTPUT.
//
//   check-cache-version --commit <id>
//     Records <id> as processed. Run after the pipeline succeeds, never
//     before - a failed run should retry on the next schedule.
//
// Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY [, R2_BUCKET]

const MARKER_KEY = "meta/last-processed-cache.json";

const s3 = createR2Client();
const bucket = r2Bucket();

const commitIndex = process.argv.indexOf("--commit");
const downloadIndex = process.argv.indexOf("--download");
const force = process.argv.includes("--force");

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});

async function main() {
  if (commitIndex !== -1) {
    const id = Number(process.argv[commitIndex + 1]);
    if (!Number.isInteger(id)) {
      throw new Error("--commit requires a cache id");
    }
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: MARKER_KEY,
        Body: JSON.stringify({ id, processedAt: new Date().toISOString() }),
        ContentType: "application/json",
      }),
    );
    console.log(`Recorded cache ${id} as processed.`);
    return;
  }

  const latest = await resolveLatestCache();
  const lastProcessedId = await readMarker();
  const isNew = force || latest.id !== lastProcessedId;
  console.log(
    `Latest cache: ${latest.id} (${latest.timestamp}), last processed: ${lastProcessedId ?? "none"}${force ? ", forced" : ""}`,
  );

  let cacheDir = "";
  if (isNew && downloadIndex !== -1) {
    const destDir = process.argv[downloadIndex + 1];
    if (!destDir) {
      throw new Error("--download requires a destination directory");
    }
    cacheDir = await downloadCache(latest, destDir);
    console.log(`Cache extracted to ${cacheDir}`);
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `new=${isNew}\ncache_id=${latest.id}\ncache_dir=${cacheDir}\n`,
    );
  }
}

async function readMarker(): Promise<number | null> {
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: MARKER_KEY }),
    );
    const body = await response.Body?.transformToString();
    return body ? (JSON.parse(body).id ?? null) : null;
  } catch (error) {
    if ((error as { name?: string }).name === "NoSuchKey") {
      return null;
    }
    throw error;
  }
}
