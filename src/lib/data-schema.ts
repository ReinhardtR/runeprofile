import { AccountType } from "@/edgeql";
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
  accountType: z.nativeEnum(AccountType),
  model: z.string(),
  skills: SkillsSchema,
  questList: QuestListSchema,
  achievementDiaries: AchievementDiariesSchema,
  combatAchievements: CombatAchievementsSchema,
  collectionLog: CollectionLogSchema,
});
