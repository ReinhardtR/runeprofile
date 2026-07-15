import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { QUESTS } from "@runeprofile/runescape";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QUESTS_PATH = path.resolve(
  __dirname,
  "../../packages/runescape/src/quests.ts",
);

// RuneProfile tracks quests by RuneLite's `Quest` enum id, so RuneLite's
// Quest.java is the source of truth for the id <-> name registry. It does NOT
// carry quest points or the free/members/mini type, so those stay manual for
// new quests (flagged in the PR).
const RUNELITE_QUEST_URL =
  "https://raw.githubusercontent.com/runelite/runelite/master/runelite-api/src/main/java/net/runelite/api/Quest.java";

const writeMode = process.argv.includes("--write");

// RuneLite lists the 10 Recipe for Disaster subquests as separate entries, but
// RuneProfile tracks Recipe for Disaster as a single quest (id 117). Exclude
// the subquests so they aren't reported as "new".
const EXCLUDED_QUEST_IDS = new Set<number>([
  2307, 2308, 2309, 2310, 2311, 2312, 2313, 2314, 2315, 2316,
]);

type SourceQuest = { id: number; name: string };

checkQuests()
  .then(() => console.log("Finished checking quests."))
  .catch((error) => {
    // Fail loudly so the GitHub Action surfaces the error instead of
    // silently exiting 0 and opening no PR.
    console.error("Error:", error);
    process.exitCode = 1;
  });

async function checkQuests() {
  const sourceQuests = await fetchRuneliteQuests();
  if (sourceQuests.length === 0) {
    throw new Error("Parsed 0 quests from RuneLite's Quest.java.");
  }
  console.log(`Loaded ${sourceQuests.length} quests from RuneLite.`);

  const existingById = new Map<number, string>(
    QUESTS.map((q) => [q.id, q.name]),
  );
  const sourceById = new Map<number, string>(
    sourceQuests.map((q) => [q.id, q.name]),
  );

  const newQuests: SourceQuest[] = [];
  const renamedQuests: { id: number; oldName: string; newName: string }[] = [];
  for (const quest of sourceQuests) {
    const existingName = existingById.get(quest.id);
    if (existingName === undefined) {
      newQuests.push(quest);
    } else if (existingName !== quest.name) {
      renamedQuests.push({
        id: quest.id,
        oldName: existingName,
        newName: quest.name,
      });
    }
  }

  const removedQuests = QUESTS.filter((q) => !sourceById.has(q.id)).map(
    (q) => ({
      id: q.id,
      name: q.name,
    }),
  );

  const hasChanges =
    newQuests.length > 0 ||
    renamedQuests.length > 0 ||
    removedQuests.length > 0;

  if (!hasChanges) {
    console.log("No changes found in quest data.");
    return;
  }

  const summary = buildSummary(newQuests, renamedQuests, removedQuests);
  console.log(summary);

  if (writeMode) {
    writeChanges(newQuests, renamedQuests);

    const summaryPath = path.join("/tmp", "quests-changes-summary.txt");
    writeFileSync(summaryPath, summary, "utf-8");
    console.log(`\nChange summary written to ${summaryPath}`);
  }
}

async function fetchRuneliteQuests(): Promise<SourceQuest[]> {
  const response = await fetch(RUNELITE_QUEST_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch RuneLite Quest.java: ${response.status} ${response.statusText}`,
    );
  }
  const text = await response.text();

  // Match enum entries like: COOKS_ASSISTANT(17, "Cook's Assistant"),
  const entryRegex = /^\s*[A-Z0-9_]+\((\d+),\s*"((?:[^"\\]|\\.)*)"\)/gm;
  const quests: SourceQuest[] = [];
  for (const match of text.matchAll(entryRegex)) {
    const id = Number(match[1]);
    if (EXCLUDED_QUEST_IDS.has(id)) continue;
    quests.push({
      id,
      name: match[2].replace(/\\"/g, '"'),
    });
  }
  return quests;
}

function buildSummary(
  newQuests: SourceQuest[],
  renamedQuests: { id: number; oldName: string; newName: string }[],
  removedQuests: SourceQuest[],
): string {
  const lines: string[] = ["## Quests Update Summary\n"];

  if (newQuests.length > 0) {
    lines.push(`### New Quests (${newQuests.length})\n`);
    for (const q of newQuests) {
      lines.push(`- \`${q.id}\` **${q.name}**`);
    }
    lines.push("");
    lines.push(
      "> **Note:** New quests are added with placeholder `points: 0` and `type: QuestType.MEMBERS`. Set the correct points/type and move them into the right section.\n",
    );
  }

  if (renamedQuests.length > 0) {
    lines.push(`### Renamed Quests (${renamedQuests.length})\n`);
    for (const q of renamedQuests) {
      lines.push(`- \`${q.id}\`: ~~${q.oldName}~~ → ${q.newName}`);
    }
    lines.push("");
  }

  if (removedQuests.length > 0) {
    lines.push(`### Removed from RuneLite (${removedQuests.length})\n`);
    lines.push(
      "> These exist in RuneProfile but not in RuneLite's `Quest` enum. Review manually — not auto-removed.\n",
    );
    for (const q of removedQuests) {
      lines.push(`- \`${q.id}\` **${q.name}**`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function writeChanges(
  newQuests: SourceQuest[],
  renamedQuests: { id: number; oldName: string; newName: string }[],
) {
  console.log(`\nWriting changes to ${QUESTS_PATH}...`);
  let text = readFileSync(QUESTS_PATH, "utf-8");

  // Apply renames in place (object may span multiple lines; quest objects have
  // no nested braces, so [^{}] safely spans the whole object).
  for (const { id, oldName, newName } of renamedQuests) {
    const objectRegex = new RegExp(`\\{[^{}]*\\bid:\\s*${id}\\s*,[^{}]*\\}`);
    const match = text.match(objectRegex);
    if (!match) {
      console.warn(`Could not locate quest object for id ${id} (${oldName})`);
      continue;
    }
    const updated = match[0].replace(
      /name:\s*"(?:[^"\\]|\\.)*"/,
      `name: ${JSON.stringify(newName)}`,
    );
    text = text.replace(match[0], () => updated);
  }

  // Append new quests as stubs just before the array's closing bracket.
  if (newQuests.length > 0) {
    const stub = newQuests
      .map(
        (q) =>
          `  { id: ${q.id}, name: ${JSON.stringify(q.name)}, points: 0, type: QuestType.MEMBERS }, // TODO: verify points & type`,
      )
      .join("\n");
    const closing = "\n] as const satisfies Quest[];";
    if (!text.includes(closing)) {
      throw new Error("Could not locate the QUESTS array closing bracket.");
    }
    text = text.replace(
      closing,
      () =>
        `\n  // Auto-detected new quests — verify points & type, then move into the correct section.\n${stub}${closing}`,
    );
  }

  writeFileSync(QUESTS_PATH, text, "utf-8");
  console.log("File saved.");
}
