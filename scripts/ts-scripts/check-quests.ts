import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DBTable } from "@abextm/cache2";

import {
  QUESTS,
  Quest,
  QuestDifficulty,
  QuestType,
} from "@runeprofile/runescape";

import { createCacheProvider } from "./lib/cache";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QUESTS_PATH = path.resolve(
  __dirname,
  "../../packages/runescape/src/quests.ts",
);

// The game cache's quest DB table (id 0, gameval name "quest") is the source
// of truth for the whole registry: row ids are the same ids RuneLite's Quest
// enum uses (and that RuneProfile tracks), and rows carry name, quest points,
// difficulty, members flag and miniquest flag — nothing stays manual.
const QUEST_DBTABLE_ID = 0;

// Column indexes in the quest DB table; names come from its GameVal entry.
const COL = {
  displayname: 2,
  // Default (absent) means released; an explicit 0 marks unreleased
  // placeholder rows, which also have "." as their display name.
  releaseType: 3,
  // 0 = quest, 1 = miniquest
  type: 4,
  members: 5,
  difficulty: 6,
  questpoints: 17,
  // Only set on Recipe for Disaster subquests (-> 117). RuneProfile tracks
  // just the parent, with the subquests' points summed onto it.
  parentQuest: 21,
} as const;

const writeMode = process.argv.includes("--write");

type SourceQuest = {
  id: number;
  name: string;
  points: number;
  difficulty: QuestDifficulty;
  type: QuestType;
};

checkQuests()
  .then(() => console.log("Finished checking quests."))
  .catch((error) => {
    // Fail loudly so the GitHub Action surfaces the error instead of
    // silently exiting 0 and opening no PR.
    console.error("Error:", error);
    process.exitCode = 1;
  });

async function checkQuests() {
  const sourceQuests = await loadCacheQuests();
  if (sourceQuests.length < 100) {
    throw new Error(
      `Parsed only ${sourceQuests.length} quests from the game cache.`,
    );
  }
  console.log(`Loaded ${sourceQuests.length} quests from the game cache.`);

  const existingById = new Map<number, Quest>(QUESTS.map((q) => [q.id, q]));
  const sourceById = new Map<number, SourceQuest>(
    sourceQuests.map((q) => [q.id, q]),
  );

  const newQuests: SourceQuest[] = [];
  const changedQuests: { old: Quest; new: SourceQuest; changes: string[] }[] =
    [];
  for (const quest of sourceQuests) {
    const existing = existingById.get(quest.id);
    if (existing === undefined) {
      newQuests.push(quest);
      continue;
    }

    const changes: string[] = [];
    if (existing.name !== quest.name) {
      changes.push(`name: "${existing.name}" → "${quest.name}"`);
    }
    if (existing.points !== quest.points) {
      changes.push(`points: ${existing.points} → ${quest.points}`);
    }
    if (existing.type !== quest.type) {
      changes.push(`type: ${typeName(existing.type)} → ${typeName(quest.type)}`);
    }
    if (existing.difficulty !== quest.difficulty) {
      changes.push(
        `difficulty: ${difficultyName(existing.difficulty)} → ${difficultyName(quest.difficulty)}`,
      );
    }
    if (changes.length > 0) {
      changedQuests.push({ old: existing, new: quest, changes });
    }
  }

  const removedQuests = QUESTS.filter((q) => !sourceById.has(q.id));

  const hasChanges =
    newQuests.length > 0 ||
    changedQuests.length > 0 ||
    removedQuests.length > 0;

  if (!hasChanges) {
    console.log("No changes found in quest data.");
    return;
  }

  const summary = buildSummary(newQuests, changedQuests, removedQuests);
  console.log(summary);

  if (writeMode) {
    writeQuests(sourceQuests);

    const summaryPath = path.join("/tmp", "quests-changes-summary.txt");
    writeFileSync(summaryPath, summary, "utf-8");
    console.log(`\nChange summary written to ${summaryPath}`);
  }
}

async function loadCacheQuests(): Promise<SourceQuest[]> {
  const provider = createCacheProvider();
  const rows = await DBTable.loadRows(provider, QUEST_DBTABLE_ID);
  if (!rows || rows.length === 0) {
    throw new Error(`Quest DB table ${QUEST_DBTABLE_ID} not found in cache.`);
  }

  // Column values are tuples; every column we read is single-valued. An
  // absent value means "table default".
  const col = <T>(row: (typeof rows)[number], index: number): T | undefined =>
    row.values[index]?.[0] as T | undefined;

  // Recipe for Disaster's parent row has 0 quest points; its subquest rows
  // carry them instead. Sum subquest points onto the parent.
  const subquestPoints = new Map<number, number>();
  for (const row of rows) {
    const parent = col<number>(row, COL.parentQuest);
    if (parent !== undefined) {
      subquestPoints.set(
        parent,
        (subquestPoints.get(parent) ?? 0) +
          (col<number>(row, COL.questpoints) ?? 0),
      );
    }
  }

  return rows
    .filter((row) => col<number>(row, COL.parentQuest) === undefined)
    .filter((row) => col<number>(row, COL.releaseType) !== 0)
    .map((row) => {
      const id = row.id as number;
      const isMini = col<number>(row, COL.type) === 1;
      const isMembers = col<number>(row, COL.members) === 1;
      return {
        id,
        name: col<string>(row, COL.displayname) ?? `Unknown quest ${id}`,
        points:
          (col<number>(row, COL.questpoints) ?? 0) +
          (subquestPoints.get(id) ?? 0),
        difficulty: (col<number>(row, COL.difficulty) ??
          QuestDifficulty.NOVICE) as QuestDifficulty,
        type: isMini
          ? QuestType.MINI
          : isMembers
            ? QuestType.MEMBERS
            : QuestType.FREE,
      };
    });
}

function buildSummary(
  newQuests: SourceQuest[],
  changedQuests: { old: Quest; new: SourceQuest; changes: string[] }[],
  removedQuests: Quest[],
): string {
  const lines: string[] = ["## Quests Update Summary\n"];

  if (newQuests.length > 0) {
    lines.push(`### New Quests (${newQuests.length})\n`);
    for (const q of newQuests) {
      lines.push(
        `- \`${q.id}\` **${q.name}** — ${q.points} qp, ${difficultyName(q.difficulty)}, ${typeName(q.type)}`,
      );
    }
    lines.push("");
  }

  if (changedQuests.length > 0) {
    lines.push(`### Changed Quests (${changedQuests.length})\n`);
    for (const q of changedQuests) {
      lines.push(
        `- \`${q.old.id}\` **${q.new.name}**: ${q.changes.join(", ")}`,
      );
    }
    lines.push("");
  }

  if (removedQuests.length > 0) {
    lines.push(`### Removed Quests (${removedQuests.length})\n`);
    lines.push(
      "> These exist in RuneProfile but not in the game cache's quest table; they are removed from the registry on `--write`.\n",
    );
    for (const q of removedQuests) {
      lines.push(`- \`${q.id}\` **${q.name}**`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

const DIFFICULTY_CODE: Record<QuestDifficulty, string> = {
  [QuestDifficulty.NOVICE]: "QuestDifficulty.NOVICE",
  [QuestDifficulty.INTERMEDIATE]: "QuestDifficulty.INTERMEDIATE",
  [QuestDifficulty.EXPERIENCED]: "QuestDifficulty.EXPERIENCED",
  [QuestDifficulty.MASTER]: "QuestDifficulty.MASTER",
  [QuestDifficulty.GRANDMASTER]: "QuestDifficulty.GRANDMASTER",
  [QuestDifficulty.SPECIAL]: "QuestDifficulty.SPECIAL",
};

function difficultyName(difficulty: QuestDifficulty): string {
  return DIFFICULTY_CODE[difficulty]?.replace("QuestDifficulty.", "") ?? "?";
}

function typeName(type: QuestType): string {
  return type === QuestType.MINI
    ? "miniquest"
    : type === QuestType.MEMBERS
      ? "members"
      : "free";
}

function typeCode(type: QuestType): string {
  return type === QuestType.MINI
    ? "QuestType.MINI"
    : type === QuestType.MEMBERS
      ? "QuestType.MEMBERS"
      : "QuestType.FREE";
}

/** Regenerates the QUESTS array in quests.ts from the cache data. */
function writeQuests(sourceQuests: SourceQuest[]) {
  console.log(`\nWriting changes to ${QUESTS_PATH}...`);
  const text = readFileSync(QUESTS_PATH, "utf-8");

  const startMarker = "export const QUESTS = [";
  const endMarker = "] as const satisfies Quest[];";
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start === -1 || end === -1) {
    throw new Error("Could not locate the QUESTS array in quests.ts.");
  }

  const section = (title: string, type: QuestType) => {
    const quests = sourceQuests
      .filter((q) => q.type === type)
      .sort((a, b) => a.name.localeCompare(b.name));
    const entries = quests.map(
      (q) =>
        `  { id: ${q.id}, name: ${JSON.stringify(q.name)}, points: ${q.points}, difficulty: ${DIFFICULTY_CODE[q.difficulty]}, type: ${typeCode(q.type)} },`,
    );
    return [`  // ${title}`, ...entries].join("\n");
  };

  const body = [
    section("FREE quests", QuestType.FREE),
    section("MEMBERS quests", QuestType.MEMBERS),
    section("MINI quests", QuestType.MINI),
  ].join("\n");

  const updated =
    text.slice(0, start) + `${startMarker}\n${body}\n` + text.slice(end);
  writeFileSync(QUESTS_PATH, updated, "utf-8");
  console.log("File saved.");
}
