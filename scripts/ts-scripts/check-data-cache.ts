import { appendFileSync } from "node:fs";

import { resolveLatestCommit } from "./lib/abextm";
import { readMarker, writeMarker } from "./lib/marker";

// Gate for the clog/CA/quest checks: compares the latest commit on
// abextm/osrs-cache against the last commit those checks processed (a
// marker object in the R2 bucket, tracked independently of the icon
// pipeline's OpenRS2 marker - see check-cache-version.ts and lib/abextm.ts
// for why these two pipelines use different sources).
//
//   check-data-cache [--force]
//     Resolves the latest commit and reports whether it's new. When run
//     inside GitHub Actions, writes `new` and `commit_sha` to
//     GITHUB_OUTPUT.
//
//   check-data-cache --commit <sha>
//     Records <sha> as processed. Run after the pipeline succeeds, never
//     before - a failed run should retry on the next schedule.
//
// Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY [, R2_BUCKET, GITHUB_TOKEN]

const MARKER_KEY = "meta/last-processed-data-commit.json";

const commitIndex = process.argv.indexOf("--commit");
const force = process.argv.includes("--force");

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});

async function main() {
  if (commitIndex !== -1) {
    const sha = process.argv[commitIndex + 1];
    if (!sha) {
      throw new Error("--commit requires a commit sha");
    }
    await writeMarker(MARKER_KEY, { sha });
    console.log(`Recorded commit ${sha} as processed.`);
    return;
  }

  const latest = await resolveLatestCommit();
  const marker = await readMarker(MARKER_KEY);
  const lastProcessedSha = (marker?.sha as string | undefined) ?? null;
  const isNew = force || latest.sha !== lastProcessedSha;
  console.log(
    `Latest commit: ${latest.sha} (${latest.message.split("\n")[0]}), last processed: ${lastProcessedSha ?? "none"}${force ? ", forced" : ""}`,
  );

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `new=${isNew}\ncommit_sha=${latest.sha}\n`,
    );
  }
}
