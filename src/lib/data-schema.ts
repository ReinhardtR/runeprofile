import { z } from "zod";

export enum Skill {
  Attack = "attack",
  Hitpoints = "hitpoints",
  Mining = "mining",
  strength = "strength",
  Agility = "agility",
  Smithing = "smithing",
  Defence = "defence",
  Herblore = "herblore",
  Fishing = "fishing",
  Ranged = "ranged",
  Thieving = "thieving",
  Cooking = "cooking",
  Prayer = "prayer",
  Crafting = "crafting",
  Firemkaing = "firemaking",
  Magic = "magic",
  Fletching = "fletching",
  Woodcutting = "woodcutting",
  Runecraft = "runecraft",
  Slayer = "slayer",
  Farming = "farming",
  Construction = "construction",
  Hunter = "hunter",
}

// export type CollectionLogTemplate = {
//   [key: string]: string[];
// };

// const getCollectionLogTemplate = async () => {
//   const response = await fetch(
//     "https://api.github.com/gists/24179c0fbfb370ce162f69dde36d72f0"
//   );

//   const template = (await response.json())["files"][
//     "collection_log_template.json"
//   ]["content"];

//   return JSON.parse(template) as CollectionLogTemplate;
// };

// const entrySchema = z.object({
//   items: z.array(
//     z.object({
//       id: z.number(),
//       name: z.string(),
//       quantity: z.number(),
//       obtained: z.boolean(),
//     })
//   ),
//   kill_count: z.array(z.string()).optional(),
// });

// export const getPlayerDataSchema = async () => {
//   const playerDataSchema = basicPlayerDataSchema;

//   const collectionLogTemplate = await getCollectionLogTemplate();

//   Object.entries(collectionLogTemplate).forEach(([tab, entries]) => {
//     const tabSchema = z.object({});

//     entries.forEach((entry) => {
//       tabSchema.extend({
//         [entry]: entrySchema,
//       });
//     });

//     playerDataSchema.shape.collectionLog.shape.tabs.extend({
//       [tab]: tabSchema,
//     });
//   });

//   return playerDataSchema;
// };

export const CollectionLogItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number(),
});

export const KillCountSchema = z.object({
  name: z.string(),
  count: z.number(),
});

export const CollectionLogEntrySchema = z.object({
  items: z.array(CollectionLogItemSchema),
  killCounts: z.array(KillCountSchema).optional(),
});

export const CollectionLogTabSchema = z.record(CollectionLogEntrySchema);

export const CollectionLogSchema = z.object({
  uniqueItemsObtained: z.number(),
  uniqueItemsTotal: z.number(),
  tabs: z.record(CollectionLogTabSchema),
});

// .transform((tabs) => {
//   return Object.entries(tabs).map(([tabName, tabData]) => ({
//     name: tabName,
//     entries: Object.entries(tabData).map(([entryName, entryData]) => ({
//       name: entryName,
//       items: entryData.items,
//       killCounts: entryData.killCounts ?? [],
//     })),
//   }));
// }),

export const QuestListSchema = z.object({
  points: z.number(),
  quests: z.array(
    z.object({
      name: z.string(),
      state: z.enum(["NOT_STARTED", "IN_PROGRESS", "FINISHED"]),
    })
  ),
});

export const SkillsSchema = z.array(
  z.object({ name: z.string(), xp: z.number() })
);

const CompletedAndTotalSchema = z.object({
  completed: z.number(),
  total: z.number(),
});

export const AchievementDiariesSchema = z.array(
  z.object({
    area: z.string(),
    Easy: CompletedAndTotalSchema,
    Medium: CompletedAndTotalSchema,
    Hard: CompletedAndTotalSchema,
    Elite: CompletedAndTotalSchema,
  })
);

export const CombatAchievementsSchema = z.object({
  Easy: CompletedAndTotalSchema,
  Medium: CompletedAndTotalSchema,
  Hard: CompletedAndTotalSchema,
  Elite: CompletedAndTotalSchema,
  Master: CompletedAndTotalSchema,
  Grandmaster: CompletedAndTotalSchema,
});

export const PlayerDataSchema = z.object({
  accountHash: z.number(),
  username: z.string(),
  // Switch to enum from EdgeDB schema
  accountType: z.enum([
    "NORMAL",
    "IRONMAN",
    "ULTIMATE_IRONMAN",
    "HARDCORE_IRONMAN",
    "GROUP_IRONMAN",
    "HARDCORE_GROUP_IRONMAN",
    "UNRANKED_GROUP_IRONMAN",
  ]),
  model: z.object({
    obj: z.string().transform((obj) => Buffer.from(obj, "utf-8")),
    mtl: z.string().transform((mtl) => Buffer.from(mtl, "utf-8")),
  }),
  skills: SkillsSchema,
  questList: QuestListSchema,
  achievementDiaries: AchievementDiariesSchema,
  combatAchievements: CombatAchievementsSchema,
  collectionLog: CollectionLogSchema,
});
