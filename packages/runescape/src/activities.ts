import { z } from "zod";

export const ActivityEventType = {
  LEVEL_UP: "level_up",
  NEW_ITEM_OBTAINED: "new_item_obtained",
  ACHIEVEMENT_DIARY_TIER_COMPLETED: "achievement_diary_tier_completed",
  COMBAT_ACHIEVEMENT_TIER_COMPLETED: "combat_achievement_tier_completed",
  QUEST_COMPLETED: "quest_completed",
  MAXED: "maxed",
  XP_MILESTONE: "xp_milestone",
  VALUABLE_DROP: "valuable_drop",
} as const;

export const LevelUpEventSchema = z.object({
  type: z.literal(ActivityEventType.LEVEL_UP),
  data: z.object({
    name: z.string(),
    level: z.number(),
  }),
});
export type LevelUpEvent = z.infer<typeof LevelUpEventSchema>;

export const NewItemObtainedEventSchema = z.object({
  type: z.literal(ActivityEventType.NEW_ITEM_OBTAINED),
  data: z.object({
    itemId: z.number(),
  }),
});
export type NewItemObtainedEvent = z.infer<typeof NewItemObtainedEventSchema>;

export const AchievementDiaryTierCompletedEventSchema = z.object({
  type: z.literal(ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED),
  data: z.object({
    areaId: z.number(),
    tier: z.number(),
  }),
});
export type AchievementDiaryTierCompletedEvent = z.infer<
  typeof AchievementDiaryTierCompletedEventSchema
>;

export const CombatAchievementTierCompletedEventSchema = z.object({
  type: z.literal(ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED),
  data: z.object({
    tierId: z.number(),
  }),
});
export type CombatAchievementTierCompletedEvent = z.infer<
  typeof CombatAchievementTierCompletedEventSchema
>;

export const QuestCompletedEventSchema = z.object({
  type: z.literal(ActivityEventType.QUEST_COMPLETED),
  data: z.object({
    questId: z.number(),
  }),
});
export type QuestCompletedEvent = z.infer<typeof QuestCompletedEventSchema>;

export const MaxedEventSchema = z.object({
  type: z.literal(ActivityEventType.MAXED),
  data: z.object({}),
});
export type MaxedEvent = z.infer<typeof MaxedEventSchema>;

export const XpMilestoneEventSchema = z.object({
  type: z.literal(ActivityEventType.XP_MILESTONE),
  data: z.object({
    name: z.string(),
    xp: z.number(),
  }),
});
export type XpMilestoneEvent = z.infer<typeof XpMilestoneEventSchema>;

export const ValuableDropEventSchema = z.object({
  type: z.literal(ActivityEventType.VALUABLE_DROP),
  data: z.object({
    itemId: z.number(),
    value: z.number(),
  }),
});
export type ValuableDropEvent = z.infer<typeof ValuableDropEventSchema>;

export const ActivityEventSchema = z.discriminatedUnion("type", [
  LevelUpEventSchema,
  NewItemObtainedEventSchema,
  AchievementDiaryTierCompletedEventSchema,
  CombatAchievementTierCompletedEventSchema,
  QuestCompletedEventSchema,
  MaxedEventSchema,
  XpMilestoneEventSchema,
  ValuableDropEventSchema,
]);

export type ActivityEvent = z.infer<typeof ActivityEventSchema>;
