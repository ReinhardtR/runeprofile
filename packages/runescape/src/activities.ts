export const ActivityEventType = {
  LEVEL_UP: "level_up",
  NEW_ITEM_OBTAINED: "new_item_obtained",
  ACHIEVEMENT_DIARY_TIER_COMPLETED: "achievement_diary_tier_completed",
  COMBAT_ACHIEVEMENT_TIER_COMPLETED: "combat_achievement_tier_completed",
  QUEST_COMPLETED: "quest_completed",
  MAXED: "maxed",
} as const;

export type LevelUpEvent = {
  type: typeof ActivityEventType.LEVEL_UP;
  data: {
    name: string;
    level: number;
  };
};

export type NewItemObtainedEvent = {
  type: typeof ActivityEventType.NEW_ITEM_OBTAINED;
  data: {
    itemId: number;
  };
};

export type AchievementDiaryTierCompletedEvent = {
  type: typeof ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED;
  data: {
    areaId: number;
    tier: number;
  };
};

export type CombatAchievementTierCompletedEvent = {
  type: typeof ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED;
  data: {
    tierId: number;
  };
};

export type QuestCompletedEvent = {
  type: typeof ActivityEventType.QUEST_COMPLETED;
  data: {
    questId: number;
  };
};

export type MaxedEvent = {
  type: typeof ActivityEventType.MAXED;
  data: {};
};

export type ActivityEvent =
  | LevelUpEvent
  | NewItemObtainedEvent
  | AchievementDiaryTierCompletedEvent
  | CombatAchievementTierCompletedEvent
  | QuestCompletedEvent
  | MaxedEvent;
