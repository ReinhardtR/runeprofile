import { z } from "@hono/zod-openapi";

import { AccountTypeSchema } from "./shared";

export const SkillSchema = z
  .object({
    name: z.string(),
    xp: z.number().openapi({ description: "Total experience points" }),
    level: z.number().openapi({ description: "Current level (capped at 99)" }),
    virtualLevel: z
      .number()
      .openapi({ description: "Virtual level beyond 99 based on XP" }),
    xpToNextLevel: z
      .number()
      .openapi({ description: "XP remaining until next level" }),
  })
  .openapi("Skill");

export const QuestSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    points: z.number(),
    type: z.enum(["free", "members", "mini"]),
    state: z.enum(["not_started", "in_progress", "finished"]),
  })
  .openapi("Quest");

export const AchievementDiaryTierSchema = z
  .object({
    tier: z
      .string()
      .openapi({ description: "Diary tier name (Easy, Medium, Hard, Elite)" }),
    completed: z
      .number()
      .openapi({ description: "Number of tasks completed in this tier" }),
    total: z
      .number()
      .openapi({ description: "Total number of tasks in this tier" }),
  })
  .openapi("AchievementDiaryTier");

export const AchievementDiaryAreaSchema = z
  .object({
    areaId: z.number(),
    area: z.string(),
    tiers: z.array(AchievementDiaryTierSchema),
  })
  .openapi("AchievementDiaryArea");

export const CombatAchievementTierSchema = z
  .object({
    id: z.number(),
    name: z.string().openapi({
      description:
        "Tier name (e.g. Easy, Medium, Hard, Elite, Master, Grandmaster)",
    }),
    completed: z
      .number()
      .openapi({ description: "Number of tasks completed in this tier" }),
    total: z.number().openapi({
      description: "Total number of tasks in this tier for this account type",
    }),
  })
  .openapi("CombatAchievementTier");

export const ClanInfoSchema = z
  .object({
    name: z.string(),
    rank: z
      .number()
      .openapi({ description: "Player's numeric rank within the clan" }),
    icon: z.number().openapi({ description: "Clan rank icon ID" }),
    title: z.string().openapi({ description: "Player's clan rank title" }),
  })
  .nullable()
  .openapi("ClanInfo");

export const AccountSummarySchema = z
  .object({
    username: z.string(),
    accountType: AccountTypeSchema,
    clan: ClanInfoSchema,
    groupName: z
      .string()
      .nullable()
      .openapi({ description: "Group Ironman group name, if applicable" }),
    skills: z.object({
      totalLevel: z
        .number()
        .openapi({ description: "Sum of all skill levels" }),
      totalXp: z.number().openapi({ description: "Sum of all skill XP" }),
    }),
    quests: z.object({
      completed: z.number(),
      started: z.number(),
      notStarted: z.number(),
      total: z.number(),
      totalPoints: z
        .number()
        .openapi({ description: "Maximum quest points available" }),
      earnedPoints: z
        .number()
        .openapi({ description: "Quest points earned by the player" }),
    }),
    collectionLog: z.object({
      obtained: z.number().openapi({
        description: "Number of unique collection log items obtained",
      }),
      total: z.number().openapi({
        description: "Total number of unique collection log items",
      }),
    }),
    combatAchievements: z.array(CombatAchievementTierSchema),
    achievementDiaries: z.array(
      z.object({
        areaId: z.number(),
        area: z.string(),
        completed: z.number(),
        total: z.number(),
      }),
    ),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("AccountSummary");

export const SkillsResponseSchema = z
  .object({ data: z.array(SkillSchema) })
  .openapi("SkillsResponse");

export const QuestsResponseSchema = z
  .object({ data: z.array(QuestSchema) })
  .openapi("QuestsResponse");

export const AchievementDiariesResponseSchema = z
  .object({ data: z.array(AchievementDiaryAreaSchema) })
  .openapi("AchievementDiariesResponse");

export const CombatAchievementsResponseSchema = z
  .object({ data: z.array(CombatAchievementTierSchema) })
  .openapi("CombatAchievementsResponse");
