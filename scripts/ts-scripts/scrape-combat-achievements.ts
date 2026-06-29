import * as cache from "@abextm/cache2";

// Combat achievement tier enum IDs in the game cache
// These enums list the struct IDs for tasks in each tier
const CA_TIER_ENUM_IDS = [
  3981, // Easy
  3982, // Medium
  3983, // Hard
  3984, // Elite
  3985, // Master
  3986, // Grandmaster
] as const;

const CA_TIER_IDS = [1, 2, 3, 4, 5, 6] as const;

// Param IDs for combat achievement task structs
const CA_TASK_VARP_INDEX = 1306 as cache.ParamID;
const CA_TASK_NAME = 1308 as cache.ParamID;
const CA_TASK_DESCRIPTION = 1309 as cache.ParamID;
const CA_TASK_TYPE = 1311 as cache.ParamID;
const CA_TASK_MONSTER = 1312 as cache.ParamID;

// Enum 3971 maps monster category IDs to display names
const CA_MONSTER_ENUM_ID = 3971;

// Enum 3969 maps task type IDs to display names
const CA_TYPE_ENUM_ID = 3969;

// Enum 3987 maps boss index -> struct (the boss list shown in the in-game "Bosses" view)
// Each boss struct has param_1315 = boss group ID (matches task param_1312 / monster enum key)
const CA_BOSS_ENUM_ID = 3987;
const CA_BOSS_GROUP_ID = 1315 as cache.ParamID;

type CombatAchievementTask = {
  index: number;
  tierId: number;
  name: string;
  description: string;
  type: string;
  monster: string;
};

scrapeCombatAchievements()
  .then(() => console.log("\nFinished scraping combat achievements."))
  .catch((error) => console.error("Error:", error));

async function scrapeCombatAchievements() {
  const provider = new cache.FlatCacheProvider({
    getFile: async (name) => {
      const response = await fetch(
        `https://raw.githubusercontent.com/abextm/osrs-cache/master/${name}`,
      );
      if (!response.ok) return;
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    },
  });

  // Load the monster category enum
  const monsterEnum = await cache.Enum.load(provider, CA_MONSTER_ENUM_ID);
  const monsterNameMap = new Map<number, string>();
  if (monsterEnum) {
    for (const [key, value] of monsterEnum.map.entries()) {
      if (typeof key === "number" && typeof value === "string" && key >= 0) {
        monsterNameMap.set(key, value);
      }
    }
    console.log(
      `Loaded ${monsterNameMap.size} monster categories from enum ${CA_MONSTER_ENUM_ID}`,
    );
  }

  // Load the task type enum
  const typeEnum = await cache.Enum.load(provider, CA_TYPE_ENUM_ID);
  const typeNameMap = new Map<number, string>();
  if (typeEnum) {
    for (const [key, value] of typeEnum.map.entries()) {
      if (typeof key === "number" && typeof value === "string") {
        typeNameMap.set(key, value);
      }
    }
    console.log(
      `Loaded ${typeNameMap.size} task types from enum ${CA_TYPE_ENUM_ID}: ${[...typeNameMap.entries()].map(([k, v]) => `${k}=${v}`).join(", ")}`,
    );
  }

  // Load the boss list enum
  const bossEnum = await cache.Enum.load(provider, CA_BOSS_ENUM_ID);
  const bossMonsterNames = new Set<string>();
  if (bossEnum) {
    for (const structId of bossEnum.map.values()) {
      const bossStruct = await cache.Struct.load(provider, structId as number);
      if (!bossStruct) continue;
      const groupId = bossStruct.params.get(CA_BOSS_GROUP_ID) as number;
      if (groupId !== undefined) {
        const monsterName = monsterNameMap.get(groupId);
        if (monsterName) {
          bossMonsterNames.add(monsterName);
        }
      }
    }
    console.log(
      `Loaded ${bossMonsterNames.size} bosses from enum ${CA_BOSS_ENUM_ID}`,
    );
  }

  const tasks: CombatAchievementTask[] = [];

  for (let tierIdx = 0; tierIdx < CA_TIER_ENUM_IDS.length; tierIdx++) {
    const tierId = CA_TIER_IDS[tierIdx];
    const tierEnumId = CA_TIER_ENUM_IDS[tierIdx];

    const tierEnum = await cache.Enum.load(provider, tierEnumId);
    if (!tierEnum) {
      console.error(`Failed to load tier enum ${tierEnumId}`);
      continue;
    }

    const taskStructIds = [...tierEnum.map.values()];
    console.log(
      `Tier ${tierId}: Found ${taskStructIds.length} tasks (enum ${tierEnumId})`,
    );

    for (const structId of taskStructIds) {
      const taskStruct = await cache.Struct.load(provider, structId as number);
      if (!taskStruct) {
        console.error(`Failed to load task struct ${structId}`);
        continue;
      }

      const name = taskStruct.params.get(CA_TASK_NAME) as string;
      const description = taskStruct.params.get(CA_TASK_DESCRIPTION) as string;
      const varpIndex = taskStruct.params.get(CA_TASK_VARP_INDEX) as number;
      const typeId = taskStruct.params.get(CA_TASK_TYPE) as number;
      const monsterId = taskStruct.params.get(CA_TASK_MONSTER) as number;

      if (name === undefined || varpIndex === undefined) {
        console.error(
          `Missing data for struct ${structId}: name=${name}, varpIndex=${varpIndex}`,
        );
        continue;
      }

      const typeName = typeNameMap.get(typeId) ?? "Unknown";
      const monsterName = monsterNameMap.get(monsterId) ?? "Unknown";

      tasks.push({
        index: varpIndex,
        tierId,
        name: name || "",
        description: description || "",
        type: typeName,
        monster: monsterName,
      });
    }
  }

  // Sort by varp index for stable ordering
  tasks.sort((a, b) => a.index - b.index);

  // Verify no duplicate indices
  const indices = new Set<number>();
  for (const task of tasks) {
    if (indices.has(task.index)) {
      console.error(`Duplicate varp index: ${task.index} (${task.name})`);
    }
    indices.add(task.index);
  }

  console.log(`\nTotal tasks: ${tasks.length}`);
  console.log(
    `Index range: ${tasks[0]?.index} - ${tasks[tasks.length - 1]?.index}`,
  );

  // Count per tier
  for (const tierId of CA_TIER_IDS) {
    const count = tasks.filter((t) => t.tierId === tierId).length;
    console.log(`  Tier ${tierId}: ${count} tasks`);
  }

  // Output the TypeScript array
  console.log("\n// --- Generated COMBAT_ACHIEVEMENT_BOSSES array ---\n");
  const sortedBossNames = [...bossMonsterNames].sort();
  console.log("export const COMBAT_ACHIEVEMENT_BOSSES = [");
  for (const name of sortedBossNames) {
    const escaped = name.replace(/'/g, "\\'");
    console.log(`  '${escaped}',`);
  }
  console.log("] as const;\n");

  console.log("// --- Generated COMBAT_ACHIEVEMENT_TASKS array ---\n");
  console.log(
    "export const COMBAT_ACHIEVEMENT_TASKS: CombatAchievementTask[] = [",
  );
  for (const task of tasks) {
    const escapedName = task.name.replace(/'/g, "\\'");
    const escapedDesc = task.description.replace(/'/g, "\\'");
    const escapedMonster = task.monster.replace(/'/g, "\\'");
    console.log(
      `  { index: ${task.index}, tierId: ${task.tierId}, name: '${escapedName}', description: '${escapedDesc}', type: '${task.type}', monster: '${escapedMonster}' },`,
    );
  }
  console.log("] as const;");
}
