import { appendFileSync } from "node:fs";

import { readMarker, writeMarker } from "./lib/marker";
import { downloadCache, resolveLatestCache } from "./lib/openrs2";

// Gate for the icon-sync pipeline: compares the newest live cache on
// OpenRS2 against the last one the icon pipeline processed (a marker
// object in the R2 bucket). Icon rendering needs a full binary disk store,
// which only OpenRS2 provides, and its crawl of a fresh cache can take
// hours to finish - see check-data-cache.ts for the much faster
// abextm/osrs-cache-backed gate the clog/CA/quest checks use instead.
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
    await writeMarker(MARKER_KEY, { id });
    console.log(`Recorded cache ${id} as processed.`);
    return;
  }

  const latest = await resolveLatestCache();
  const marker = await readMarker(MARKER_KEY);
  const lastProcessedId = (marker?.id as number | undefined) ?? null;
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
