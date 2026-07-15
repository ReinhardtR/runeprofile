import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMBAT_ACHIEVEMENT_BOSSES,
  COMBAT_ACHIEVEMENT_TASKS,
  COMBAT_ACHIEVEMENT_TASK_TYPES,
} from "@runeprofile/runescape";

import { createCacheProvider } from "./lib/cache";
import {
  CombatAchievementTask,
  loadCombatAchievements,
} from "./lib/combat-achievements";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CA_PATH = path.resolve(
  __dirname,
  "../../packages/runescape/src/combat-achievements.ts",
);

const writeMode = process.argv.includes("--write");

type TaskChange = {
  index: number;
  field: "tierId" | "name" | "description" | "type" | "monster";
  oldValue: string | number;
  newValue: string | number;
};

checkCombatAchievements()
  .then(() => console.log("Finished checking combat achievements."))
  .catch((error) => {
    // Fail loudly so the GitHub Action surfaces the error instead of
    // silently exiting 0 and opening no PR.
    console.error("Error:", error);
    process.exitCode = 1;
  });

async function checkCombatAchievements() {
  const provider = createCacheProvider();
  const { tasks, bosses } = await loadCombatAchievements(provider);

  if (tasks.length === 0) {
    throw new Error("Loaded 0 combat achievement tasks from the cache.");
  }

  // --- Compare tasks (keyed by varp index) ---
  const existingByIndex = new Map(
    COMBAT_ACHIEVEMENT_TASKS.map((t) => [t.index, t]),
  );
  const cacheByIndex = new Map(tasks.map((t) => [t.index, t]));

  const newTasks: CombatAchievementTask[] = [];
  const removedTasks: CombatAchievementTask[] = [];
  const changedTasks: TaskChange[] = [];

  for (const task of tasks) {
    const existing = existingByIndex.get(task.index);
    if (!existing) {
      newTasks.push(task);
      continue;
    }
    const fields = [
      "tierId",
      "name",
      "description",
      "type",
      "monster",
    ] as const;
    for (const field of fields) {
      if (existing[field] !== task[field]) {
        changedTasks.push({
          index: task.index,
          field,
          oldValue: existing[field],
          newValue: task[field],
        });
      }
    }
  }

  for (const existing of COMBAT_ACHIEVEMENT_TASKS) {
    if (!cacheByIndex.has(existing.index)) {
      removedTasks.push(existing);
    }
  }

  // --- Compare bosses ---
  const existingBosses = new Set<string>(COMBAT_ACHIEVEMENT_BOSSES);
  const cacheBosses = new Set(bosses);
  const addedBosses = bosses.filter((b) => !existingBosses.has(b));
  const removedBosses = COMBAT_ACHIEVEMENT_BOSSES.filter(
    (b) => !cacheBosses.has(b),
  );

  // --- New task types (would need adding to the union manually) ---
  const knownTypes = new Set<string>(COMBAT_ACHIEVEMENT_TASK_TYPES);
  const newTypes = [...new Set(tasks.map((t) => t.type))].filter(
    (t) => !knownTypes.has(t),
  );

  const hasChanges =
    newTasks.length > 0 ||
    removedTasks.length > 0 ||
    changedTasks.length > 0 ||
    addedBosses.length > 0 ||
    removedBosses.length > 0;

  if (!hasChanges) {
    console.log("No changes found in combat achievement data.");
    return;
  }

  const summary = buildSummary(
    newTasks,
    removedTasks,
    changedTasks,
    addedBosses,
    removedBosses,
    newTypes,
  );
  console.log(summary);

  if (writeMode) {
    writeChanges(tasks, bosses);

    // One summary file per data type; the Action concatenates whichever exist.
    const summaryPath = path.join("/tmp", "ca-changes-summary.txt");
    writeFileSync(summaryPath, summary, "utf-8");
    console.log(`\nChange summary written to ${summaryPath}`);
  }
}

function buildSummary(
  newTasks: CombatAchievementTask[],
  removedTasks: CombatAchievementTask[],
  changedTasks: TaskChange[],
  addedBosses: string[],
  removedBosses: string[],
  newTypes: string[],
): string {
  const lines: string[] = ["## Combat Achievements Update Summary\n"];

  if (newTypes.length > 0) {
    lines.push(
      `> ⚠️ **New task type(s) found:** ${newTypes.map((t) => `\`${t}\``).join(", ")}. Add these to \`COMBAT_ACHIEVEMENT_TASK_TYPES\` or the package will not type-check.\n`,
    );
  }

  if (newTasks.length > 0) {
    lines.push(`### New Tasks (${newTasks.length})\n`);
    for (const t of newTasks) {
      lines.push(
        `- \`${t.index}\` **${t.name}** (tier ${t.tierId}, ${t.monster}) — ${t.description}`,
      );
    }
    lines.push("");
  }

  if (changedTasks.length > 0) {
    lines.push(`### Changed Tasks (${changedTasks.length})\n`);
    for (const c of changedTasks) {
      lines.push(
        `- \`${c.index}\` ${c.field}: ~~${c.oldValue}~~ → ${c.newValue}`,
      );
    }
    lines.push("");
  }

  if (removedTasks.length > 0) {
    lines.push(`### Removed Tasks (${removedTasks.length})\n`);
    for (const t of removedTasks) {
      lines.push(`- \`${t.index}\` **${t.name}**`);
    }
    lines.push("");
  }

  if (addedBosses.length > 0) {
    lines.push(`### New Bosses (${addedBosses.length})\n`);
    for (const b of addedBosses) lines.push(`- ${b}`);
    lines.push("");
  }

  if (removedBosses.length > 0) {
    lines.push(`### Removed Bosses (${removedBosses.length})\n`);
    for (const b of removedBosses) lines.push(`- ${b}`);
    lines.push("");
  }

  return lines.join("\n");
}

// Task strings are always single-quoted with escaping (matches the existing data).
function singleQuote(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

// Boss strings follow prettier's preference: double quotes when that avoids
// escaping an apostrophe, otherwise single quotes (matches the existing data).
function prettierQuote(value: string): string {
  if (value.includes("'") && !value.includes('"')) {
    return `"${value}"`;
  }
  return singleQuote(value);
}

function writeChanges(tasks: CombatAchievementTask[], bosses: string[]) {
  console.log(`\nWriting changes to ${CA_PATH}...`);

  // Both arrays are fully cache-generated and carry `// prettier-ignore`, so we
  // regenerate them wholesale via text replacement to keep the exact hand-rolled
  // formatting (one element per line) that prettier would otherwise leave alone.
  const bossesBlock = `export const COMBAT_ACHIEVEMENT_BOSSES = [\n${bosses
    .map((b) => `  ${prettierQuote(b)},`)
    .join("\n")}\n] as const;`;

  const tasksBlock = `export const COMBAT_ACHIEVEMENT_TASKS: CombatAchievementTask[] = [\n${tasks
    .map(
      (t) =>
        `  { index: ${t.index}, tierId: ${t.tierId}, name: ${singleQuote(t.name)}, description: ${singleQuote(t.description)}, type: ${singleQuote(t.type)}, monster: ${singleQuote(t.monster)} },`,
    )
    .join("\n")}\n] as const;`;

  let text = readFileSync(CA_PATH, "utf-8");
  text = replaceBlock(
    text,
    /export const COMBAT_ACHIEVEMENT_BOSSES = \[[\s\S]*?\n\] as const;/,
    bossesBlock,
    "COMBAT_ACHIEVEMENT_BOSSES",
  );
  text = replaceBlock(
    text,
    /export const COMBAT_ACHIEVEMENT_TASKS: CombatAchievementTask\[\] = \[[\s\S]*?\n\] as const;/,
    tasksBlock,
    "COMBAT_ACHIEVEMENT_TASKS",
  );
  writeFileSync(CA_PATH, text, "utf-8");
  console.log("File saved.");
}

function replaceBlock(
  text: string,
  pattern: RegExp,
  replacement: string,
  name: string,
): string {
  if (!pattern.test(text)) {
    throw new Error(`Could not locate ${name} block in ${CA_PATH}`);
  }
  // Use a function replacer so `$` sequences in the data aren't interpreted.
  return text.replace(pattern, () => replacement);
}
