import { z } from "@hono/zod-openapi";

import { AccountTypeSchema } from "./shared";

// --- Data schemas per event type ---

const LevelUpData = z.object({
  name: z.string().openapi({ description: "Skill name" }),
  level: z.number().openapi({ description: "New level reached" }),
});

const NewItemObtainedData = z.object({
  itemId: z.number().openapi({ description: "Collection log item ID" }),
});

const AchievementDiaryTierCompletedData = z.object({
  areaId: z.number().openapi({ description: "Achievement diary area ID" }),
  tier: z.number().openapi({
    description: "Diary tier index (0=Easy, 1=Medium, 2=Hard, 3=Elite)",
  }),
});

const CombatAchievementTierCompletedData = z.object({
  tierId: z.number().openapi({ description: "Combat achievement tier ID" }),
});

const QuestCompletedData = z.object({
  questId: z.number().openapi({ description: "Quest ID" }),
});

const MaxedData = z.object({});

const XpMilestoneData = z.object({
  name: z.string().openapi({ description: "Skill name" }),
  xp: z.number().openapi({ description: "XP milestone reached" }),
});

const ValuableDropData = z.object({
  itemId: z.number().openapi({ description: "Item ID" }),
  value: z.number().openapi({ description: "Estimated value in gold pieces" }),
});

// --- Activity variant factories ---

function activityVariant<T extends string, S extends z.ZodRawShape>(
  type: T,
  dataSchema: z.ZodObject<S>,
  name: string,
) {
  return z
    .object({
      type: z.literal(type),
      data: dataSchema,
      enriched: z
        .record(z.string())
        .optional()
        .openapi({
          description:
            "Human-readable resolved names for IDs in data (e.g. itemName, questName, tierName)",
          example: { itemName: "Twisted bow" },
        }),
      createdAt: z.string().datetime(),
    })
    .openapi(name);
}

function clanActivityVariant<T extends string, S extends z.ZodRawShape>(
  type: T,
  dataSchema: z.ZodObject<S>,
  name: string,
) {
  return z
    .object({
      type: z.literal(type),
      data: dataSchema,
      enriched: z
        .record(z.string())
        .optional()
        .openapi({
          description:
            "Human-readable resolved names for IDs in data (e.g. itemName, questName, tierName)",
          example: { itemName: "Twisted bow" },
        }),
      createdAt: z.string().datetime(),
      account: z.object({
        username: z.string(),
        accountType: AccountTypeSchema,
      }),
    })
    .openapi(name);
}

// --- Activity variants ---

const LevelUpActivity = activityVariant(
  "level_up",
  LevelUpData,
  "LevelUpActivity",
);
const NewItemObtainedActivity = activityVariant(
  "new_item_obtained",
  NewItemObtainedData,
  "NewItemObtainedActivity",
);
const DiaryTierCompletedActivity = activityVariant(
  "achievement_diary_tier_completed",
  AchievementDiaryTierCompletedData,
  "DiaryTierCompletedActivity",
);
const CombatTierCompletedActivity = activityVariant(
  "combat_achievement_tier_completed",
  CombatAchievementTierCompletedData,
  "CombatTierCompletedActivity",
);
const QuestCompletedActivity = activityVariant(
  "quest_completed",
  QuestCompletedData,
  "QuestCompletedActivity",
);
const MaxedActivity = activityVariant("maxed", MaxedData, "MaxedActivity");
const XpMilestoneActivity = activityVariant(
  "xp_milestone",
  XpMilestoneData,
  "XpMilestoneActivity",
);
const ValuableDropActivity = activityVariant(
  "valuable_drop",
  ValuableDropData,
  "ValuableDropActivity",
);

// --- Clan activity variants ---

const LevelUpClanActivity = clanActivityVariant(
  "level_up",
  LevelUpData,
  "LevelUpClanActivity",
);
const NewItemObtainedClanActivity = clanActivityVariant(
  "new_item_obtained",
  NewItemObtainedData,
  "NewItemObtainedClanActivity",
);
const DiaryTierCompletedClanActivity = clanActivityVariant(
  "achievement_diary_tier_completed",
  AchievementDiaryTierCompletedData,
  "DiaryTierCompletedClanActivity",
);
const CombatTierCompletedClanActivity = clanActivityVariant(
  "combat_achievement_tier_completed",
  CombatAchievementTierCompletedData,
  "CombatTierCompletedClanActivity",
);
const QuestCompletedClanActivity = clanActivityVariant(
  "quest_completed",
  QuestCompletedData,
  "QuestCompletedClanActivity",
);
const MaxedClanActivity = clanActivityVariant(
  "maxed",
  MaxedData,
  "MaxedClanActivity",
);
const XpMilestoneClanActivity = clanActivityVariant(
  "xp_milestone",
  XpMilestoneData,
  "XpMilestoneClanActivity",
);
const ValuableDropClanActivity = clanActivityVariant(
  "valuable_drop",
  ValuableDropData,
  "ValuableDropClanActivity",
);

// --- Discriminated unions ---

export const ActivityDataSchema = z.discriminatedUnion("type", [
  LevelUpActivity,
  NewItemObtainedActivity,
  DiaryTierCompletedActivity,
  CombatTierCompletedActivity,
  QuestCompletedActivity,
  MaxedActivity,
  XpMilestoneActivity,
  ValuableDropActivity,
]);

export type Activity = z.infer<typeof ActivityDataSchema>;

export const ClanActivitySchema = z.discriminatedUnion("type", [
  LevelUpClanActivity,
  NewItemObtainedClanActivity,
  DiaryTierCompletedClanActivity,
  CombatTierCompletedClanActivity,
  QuestCompletedClanActivity,
  MaxedClanActivity,
  XpMilestoneClanActivity,
  ValuableDropClanActivity,
]);

export type ClanActivity = z.infer<typeof ClanActivitySchema>;

// --- Response schemas ---

export const ActivitiesResponseSchema = z
  .object({
    activities: z.array(ActivityDataSchema),
    nextCursor: z.string().nullable().openapi({
      description: "Cursor for the next page, null if no more results",
    }),
    prevCursor: z.string().nullable().openapi({
      description: "Cursor for the previous page, null if at the start",
    }),
    hasMore: z
      .boolean()
      .openapi({ description: "Whether more results exist after this page" }),
    hasPrev: z
      .boolean()
      .openapi({ description: "Whether results exist before this page" }),
  })
  .openapi("ActivitiesResponse");

export const ClanActivitiesResponseSchema = z
  .object({
    activities: z.array(ClanActivitySchema),
    nextCursor: z.string().nullable().openapi({
      description: "Cursor for the next page, null if no more results",
    }),
    prevCursor: z.string().nullable().openapi({
      description: "Cursor for the previous page, null if at the start",
    }),
    hasMore: z
      .boolean()
      .openapi({ description: "Whether more results exist after this page" }),
    hasPrev: z
      .boolean()
      .openapi({ description: "Whether results exist before this page" }),
  })
  .openapi("ClanActivitiesResponse");
