import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Regenerates apps/web/src/core/assets/hiscore-icons.json straight from the
// game cache (headless sprite dump via scripts/item-icons, keyed by
// RuneLite's HiscoreSkill enum - same keys and bytes the old in-client dev
// tool produced). Run by the daily game-data pipeline against its downloaded
// cache; the file only changes when Jagex ships new/changed sprites or
// RuneLite adds hiscore entries, and then rides the game-data PR.
//
// Requires OSRS_CACHE_DIR (or --cache-dir) pointing at an extracted disk
// store. Writes /tmp/hiscore-icons-changes-summary.txt when it changed
// anything, matching the other update scripts' summary convention.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RENDERER_DIR = path.resolve(__dirname, "../item-icons");
const TARGET = path.resolve(
  __dirname,
  "../../apps/web/src/core/assets/hiscore-icons.json",
);

const cacheDirIndex = process.argv.indexOf("--cache-dir");
const cacheDir =
  cacheDirIndex === -1
    ? process.env.OSRS_CACHE_DIR
    : process.argv[cacheDirIndex + 1];
if (!cacheDir) {
  console.error(
    "A disk-store cache is required: set OSRS_CACHE_DIR or pass --cache-dir",
  );
  process.exit(1);
}

const outJson = path.join(
  mkdtempSync(path.join(os.tmpdir(), "hiscore-icons-")),
  "hiscore-icons.json",
);
execFileSync(
  process.platform === "win32" ? "gradlew.bat" : "./gradlew",
  [
    "--no-daemon",
    "-q",
    "run",
    "-PmainClass=com.runeprofile.itemicons.DumpHiscoreIcons",
    `--args=${cacheDir} ${outJson}`,
  ],
  { cwd: RENDERER_DIR, stdio: "inherit" },
);

const next: Record<string, string> = JSON.parse(readFileSync(outJson, "utf-8"));
const current: Record<string, string> = JSON.parse(
  readFileSync(TARGET, "utf-8"),
);

const added = Object.keys(next).filter((k) => !(k in current));
const removed = Object.keys(current).filter((k) => !(k in next));
const changed = Object.keys(next).filter(
  (k) => k in current && current[k] !== next[k],
);

if (added.length === 0 && removed.length === 0 && changed.length === 0) {
  console.log("No changes found in hiscore icons.");
  process.exit(0);
}

writeFileSync(TARGET, readFileSync(outJson));
console.log(
  `Updated hiscore icons: ${added.length} added, ${changed.length} changed, ${removed.length} removed.`,
);

const lines = ["## Hiscore Icons Update Summary\n"];
if (added.length > 0) lines.push(`- Added: ${added.join(", ")}`);
if (changed.length > 0) lines.push(`- Changed: ${changed.join(", ")}`);
if (removed.length > 0) lines.push(`- Removed: ${removed.join(", ")}`);
lines.push("");
writeFileSync("/tmp/hiscore-icons-changes-summary.txt", lines.join("\n"));
