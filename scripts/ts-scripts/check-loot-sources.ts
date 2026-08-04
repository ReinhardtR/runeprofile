import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as cache from "@abextm/cache2";

import {
  COLLECTION_LOG_ITEMS,
  SPECIAL_VALUABLE_DROPS,
} from "@runeprofile/runescape";

import { createCacheProvider } from "./lib/cache";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOOT_SOURCES_PATH = path.resolve(
  __dirname,
  "../../packages/runescape/src/loot-sources.ts",
);

// The plugin reports a drop's source as a type plus an id, never a name, so
// these registries are what turn "npc 3162" into "General Graardor" when an
// activity is served. Ids come straight from the game's four loot scripts:
//   7192 npc, 7194 loc, 7196 obj (an item that was opened), 7198 event enum.
//
// Regenerating them here means a boss released today is named today, without a
// deploy — same as the quest registry.

/** Enum mapping the event source ids used by loot script 7198 to their names. */
const LOOT_EVENT_NAME_ENUM = 4976 as cache.EnumID;

// Locs are the one registry that needs an opinion: the cache has ~30k named
// ones (606 KB) and all but a handful are scenery. Their ops do not
// discriminate — plenty of lootable chests carry no distinctive op — so the
// filter is the name itself. Add to this list when a source turns up unnamed
// in an activity; a false positive costs a few bytes, a miss costs a label.
const LOC_NAME_PATTERN =
  /chest|locker|casket|sarcophagus|coffin|crate|urn|barrel|reward|stash|safe|cache/i;

// The item registry names every item RuneProfile can show: the dropped item in a
// valuable drop, an item opened as a loot source (script 7196), and collection
// log items. Anything with a GE price can be a valuable drop, so tradeables are
// in wholesale; the untradeable exceptions are the ones the backend hand-prices
// and the collection log's own items, which include untradeables like pets.
const SPECIAL_VALUABLE_DROP_IDS = new Set(
  SPECIAL_VALUABLE_DROPS.map((drop) => drop.itemId),
);
const COLLECTION_LOG_ITEM_NAMES = new Map(
  Object.entries(COLLECTION_LOG_ITEMS).map(([id, name]) => [Number(id), name]),
);

const writeMode = process.argv.includes("--write");

type Registry = {
  key: string;
  label: string;
  comment: string;
  entries: Map<number, string>;
};

checkLootSources()
  .then(() => console.log("Finished checking loot sources."))
  .catch((error) => {
    // Fail loudly so the GitHub Action surfaces the error instead of silently
    // exiting 0 and opening no PR.
    console.error("Error:", error);
    process.exitCode = 1;
  });

async function checkLootSources() {
  const provider = createCacheProvider();
  const registries = await buildRegistries(provider);

  for (const registry of registries) {
    console.log(
      `${registry.label}: ${registry.entries.size} entries, ${sizeKb(registry.entries)} KB`,
    );
  }

  verifyCollectionLogItems(registries);

  const current = readFileSync(LOOT_SOURCES_PATH, "utf-8");
  const changes = registries.flatMap((registry) =>
    diffRegistry(current, registry),
  );

  if (changes.length === 0) {
    console.log("\nNo changes.");
    return;
  }

  console.log(`\n${changes.length} change(s):`);
  for (const change of changes.slice(0, 40)) {
    console.log(`  ${change}`);
  }
  if (changes.length > 40) {
    console.log(`  ...and ${changes.length - 40} more`);
  }

  if (!writeMode) {
    console.log("\nRun with --write to apply.");
    return;
  }

  writeRegistries(registries);

  // The workflow builds its PR body from these files, and only opens a PR when
  // at least one exists — without it a regenerated registry would be thrown away.
  const summaryPath = path.join("/tmp", "loot-sources-changes-summary.txt");
  writeFileSync(summaryPath, buildSummary(registries, changes), "utf-8");
  console.log(`\nChange summary written to ${summaryPath}`);
}

/**
 * The collection log registry is generated from the same cache by check-clog, so
 * the two must agree on every item they share. A disagreement means one of them
 * is stale, which would show a player two different names for one item.
 */
function verifyCollectionLogItems(registries: Registry[]) {
  const items = registries.find((r) => r.key === "TRACKED_ITEM_NAMES")!.entries;
  const problems: string[] = [];

  for (const [id, name] of COLLECTION_LOG_ITEM_NAMES) {
    const found = items.get(id);
    if (found === undefined) {
      problems.push(`${id} (${name}) is missing`);
    } else if (found !== name) {
      problems.push(`${id} is "${found}" here but "${name}" in the collection log`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Item names disagree with the collection log registry:\n  ${problems.slice(0, 20).join("\n  ")}` +
        (problems.length > 20 ? `\n  ...and ${problems.length - 20} more` : ""),
    );
  }

  console.log(
    `Cross-checked ${COLLECTION_LOG_ITEM_NAMES.size} collection log item names: all present and matching.`,
  );
}

function buildSummary(registries: Registry[], changes: string[]): string {
  const counts = new Map<string, number>();
  for (const change of changes) {
    const key = change.split(" ")[1] ?? "?";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const lines = [`### Loot Sources (${changes.length} changes)\n`];
  for (const registry of registries) {
    lines.push(
      `- \`${registry.key}\`: ${registry.entries.size} entries, ${counts.get(registry.key) ?? 0} changed`,
    );
  }
  lines.push("");
  lines.push("<details><summary>Changes</summary>\n");
  for (const change of changes.slice(0, 200)) {
    lines.push(`- \`${change}\``);
  }
  if (changes.length > 200) {
    lines.push(`- ...and ${changes.length - 200} more`);
  }
  lines.push("\n</details>");
  lines.push("");
  return lines.join("\n");
}

async function buildRegistries(
  provider: cache.CacheProvider,
): Promise<Registry[]> {
  const npcs = await cache.NPC.all(provider);
  const locs = await cache.Obj.all(provider);
  const items = await cache.Item.all(provider);
  const events = await cache.Enum.load(provider, LOOT_EVENT_NAME_ENUM);

  if (!events) {
    throw new Error(`Failed to load loot event enum ${LOOT_EVENT_NAME_ENUM}.`);
  }

  return [
    {
      key: "NPC_SOURCE_NAMES",
      label: "NPCs",
      comment: "Every named npc, the sources reported by loot script 7192.",
      entries: collect(npcs.map((npc) => [npc.id, npc.name])),
    },
    {
      key: "LOC_SOURCE_NAMES",
      label: "Locs (container-shaped names)",
      comment:
        "Objects that look like something loot comes out of, reported by loot script 7194.",
      entries: collect(
        locs
          .filter((loc) => isNamed(loc.name) && LOC_NAME_PATTERN.test(loc.name))
          .map((loc) => [loc.id, loc.name]),
      ),
    },
    {
      key: "TRACKED_ITEM_NAMES",
      label: "Items (tradeable + hand-priced + collection log)",
      comment:
        "Every item RuneProfile can name: valuable drops, items opened as a loot source (script 7196), and collection log items.",
      entries: collect(
        items
          .filter(
            (item) =>
              isTemplateUnset(item.noteTemplate) &&
              isTemplateUnset(item.placeholderTemplate) &&
              (item.isTradeable ||
                SPECIAL_VALUABLE_DROP_IDS.has(item.id) ||
                COLLECTION_LOG_ITEM_NAMES.has(item.id)),
          )
          .map((item) => [item.id, item.name]),
      ),
    },
    {
      key: "LOOT_EVENT_NAMES",
      label: "Loot events",
      comment: `Event sources reported by loot script 7198, from enum ${LOOT_EVENT_NAME_ENUM}.`,
      entries: collect([...events.map].map(([id, name]) => [id, name])),
    },
  ];
}

function collect(pairs: Array<[number, unknown]>): Map<number, string> {
  const entries = new Map<number, string>();
  for (const [id, name] of pairs) {
    if (!isNamed(name)) continue;
    const stripped = stripTags(name);
    if (stripped.length === 0) continue;
    entries.set(id, stripped);
  }
  return new Map([...entries].sort((a, b) => a[0] - b[0]));
}

/**
 * Cache names carry colour markup — 297 npcs are wrapped in <col=00ffff>, and a
 * few locs too — which has no business reaching a profile page.
 */
function stripTags(name: string): string {
  return name.replace(/<[^>]*>/g, "").trim();
}

function isNamed(name: unknown): name is string {
  return typeof name === "string" && name.length > 0 && name !== "null";
}

/** Note and placeholder links are -1 when the item is the real thing. */
function isTemplateUnset(template: number | undefined): boolean {
  return template === undefined || template <= 0;
}

function sizeKb(entries: Map<number, string>): string {
  return (
    JSON.stringify(Object.fromEntries(entries)).length / 1024
  ).toFixed(0);
}

function diffRegistry(current: string, registry: Registry): string[] {
  const existing = parseRegistry(current, registry.key);
  const changes: string[] = [];

  for (const [id, name] of registry.entries) {
    const before = existing.get(id);
    if (before === undefined) {
      changes.push(`+ ${registry.key} ${id} ${name}`);
    } else if (before !== name) {
      changes.push(`~ ${registry.key} ${id} ${before} -> ${name}`);
    }
  }
  for (const [id, name] of existing) {
    if (!registry.entries.has(id)) {
      changes.push(`- ${registry.key} ${id} ${name}`);
    }
  }

  return changes;
}

function parseRegistry(text: string, key: string): Map<number, string> {
  const entries = new Map<number, string>();
  const start = text.indexOf(startMarker(key));
  if (start === -1) return entries;

  const end = text.indexOf(endMarker, start);
  const body = text.slice(start + startMarker(key).length, end);
  for (const match of body.matchAll(/^\s*(\d+): (".*"),$/gm)) {
    entries.set(Number(match[1]), JSON.parse(match[2]) as string);
  }
  return entries;
}

const startMarker = (key: string) =>
  `export const ${key}: Record<number, string> = {`;
const endMarker = "\n};";

/** Rewrites loot-sources.ts from the cache data. */
function writeRegistries(registries: Registry[]) {
  console.log(`\nWriting ${LOOT_SOURCES_PATH}...`);

  const body = registries
    .map((registry) => {
      const entries = [...registry.entries]
        .map(([id, name]) => `  ${id}: ${JSON.stringify(name)},`)
        .join("\n");
      return [
        `/** ${registry.comment} */`,
        startMarker(registry.key),
        entries,
        "};",
      ].join("\n");
    })
    .join("\n\n");

  const header = [
    "// Generated by scripts/ts-scripts/check-loot-sources.ts from the game cache.",
    "// Do not edit by hand: the daily Update Game Data workflow regenerates it.",
    "//",
    "// Ids are what the game's loot scripts report, so these turn a drop's",
    "// (source type, source id) into a name when an activity is served.",
  ].join("\n");

  writeFileSync(LOOT_SOURCES_PATH, `${header}\n\n${body}\n`, "utf-8");
  console.log("File saved.");
}
