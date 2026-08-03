import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Regenerates the web app's base64 sprite-icon assets straight from the game
// cache (headless dumps via scripts/item-icons), replacing what the plugin's
// in-client dev buttons used to produce. Run by the daily game-data pipeline
// against its downloaded cache; each file is only rewritten when its sprites
// actually changed, and the diff rides the game-data PR.
//
// Requires OSRS_CACHE_DIR (or --cache-dir) pointing at an extracted disk
// store. Writes /tmp/sprite-icons-changes-summary.txt when anything changed,
// matching the other update scripts' summary convention.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RENDERER_DIR = path.resolve(__dirname, "../item-icons");
const ASSETS_DIR = path.resolve(__dirname, "../../apps/web/src/core/assets");

const SHEETS = [
  {
    label: "Hiscore icons",
    // Keyed by hiscore skill/boss/activity name. The name -> sprite mapping
    // comes from RuneLite's HiscoreSkill enum: the hiscore set is a website
    // API contract, not cache data (the cache has skill icons and ~30 boss
    // structs, but nothing covering clue scrolls, LMS, raid variants etc.).
    mainClass: "com.runeprofile.itemicons.DumpHiscoreIcons",
    file: "hiscore-icons.json",
  },
  {
    label: "Clan rank icons",
    // Fully cache-native: enum 3798 (CLAN_RANK_GRAPHIC) maps rank id -> sprite.
    mainClass: "com.runeprofile.itemicons.DumpClanRankIcons",
    file: "clan-rank-icons.json",
  },
];

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

const tmpDir = mkdtempSync(path.join(os.tmpdir(), "sprite-icons-"));
const summary: string[] = [];

for (const sheet of SHEETS) {
  const outJson = path.join(tmpDir, sheet.file);
  execFileSync(
    process.platform === "win32" ? "gradlew.bat" : "./gradlew",
    [
      "--no-daemon",
      "-q",
      "run",
      `-PmainClass=${sheet.mainClass}`,
      `--args=${cacheDir} ${outJson}`,
    ],
    { cwd: RENDERER_DIR, stdio: "inherit" },
  );

  const target = path.join(ASSETS_DIR, sheet.file);
  const next: Record<string, string> = JSON.parse(
    readFileSync(outJson, "utf-8"),
  );
  const current: Record<string, string> = JSON.parse(
    readFileSync(target, "utf-8"),
  );

  const added = Object.keys(next).filter((k) => !(k in current));
  const removed = Object.keys(current).filter((k) => !(k in next));
  const changed = Object.keys(next).filter(
    (k) => k in current && current[k] !== next[k],
  );

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    console.log(`${sheet.label}: no changes.`);
    continue;
  }

  writeFileSync(target, readFileSync(outJson));
  console.log(
    `${sheet.label}: ${added.length} added, ${changed.length} changed, ${removed.length} removed.`,
  );

  summary.push(`### ${sheet.label}\n`);
  if (added.length > 0) summary.push(`- Added: ${added.join(", ")}`);
  if (changed.length > 0) summary.push(`- Changed: ${changed.join(", ")}`);
  if (removed.length > 0) summary.push(`- Removed: ${removed.join(", ")}`);
  summary.push("");
}

if (summary.length > 0) {
  writeFileSync(
    "/tmp/sprite-icons-changes-summary.txt",
    ["## Sprite Icons Update Summary\n", ...summary].join("\n"),
  );
}
