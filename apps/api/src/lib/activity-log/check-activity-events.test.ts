import { describe, expect, test } from "vitest";

import {
  QuestState,
  getAchievementDiaryTierTaskCount,
  getCombatAchievementTierTaskCount,
} from "@runeprofile/runescape";

import {
  checkAchievementDiaryTierCompletedEvents,
  checkCombatAchievementTierCompletedEvents,
  checkLevelUpEvents,
  checkNewItemObtainedEvents,
  checkQuestCompletedEvents,
} from "~/lib/activity-log/check-activity-events";
import { ProfileUpdates } from "~/lib/profiles/get-profile-updates";

describe("LEVEL UP EVENTS", () => {
  test("milestone", () => {
    expect(
      checkLevelUpEvents([
        { name: "Attack", xp: 13034431, oldXp: 11805606 }, // 98 -> 99
        { name: "Strength", xp: 13034431, oldXp: 11805606 }, // 98 -> 99
      ]),
    ).toEqual([
      { type: "level_up", data: { name: "Attack", level: 99 } },
      { type: "level_up", data: { name: "Strength", level: 99 } },
    ]);
  });

  test("milestone skip", () => {
    expect(
      checkLevelUpEvents([
        { name: "Defence", xp: 13034431, oldXp: 0 }, // 1 -> 99
      ]),
    ).toEqual([{ type: "level_up", data: { name: "Defence", level: 99 } }]);
  });

  test("no milestone", () => {
    const skillUpdates: ProfileUpdates["skills"] = [
      { name: "Magic", xp: 100, oldXp: 83 }, // 1 -> 1
    ];
    expect(checkLevelUpEvents(skillUpdates)).toEqual([]);
  });

  test("should not generate level up event if old level is already at or above milestone", () => {
    expect(
      checkLevelUpEvents([{ name: "Ranged", xp: 13034431, oldXp: 13034432 }]), // 99 -> 99
    ).toEqual([]);
  });
});

describe("NEW ITEM OBTAINED EVENTS", () => {
  test("new items", () => {
    expect(
      checkNewItemObtainedEvents([
        { id: 123, quantity: 1, oldQuantity: 0 },
        { id: 456, quantity: 5, oldQuantity: 0 },
      ]),
    ).toEqual([
      { type: "new_item_obtained", data: { itemId: 123 } },
      { type: "new_item_obtained", data: { itemId: 456 } },
    ]);
  });

  test("old items", () => {
    expect(
      checkNewItemObtainedEvents([
        { id: 123, quantity: 2, oldQuantity: 1 },
        { id: 789, quantity: 10, oldQuantity: 5 },
      ]),
    ).toEqual([]);
  });

  test("no change", () => {
    expect(
      checkNewItemObtainedEvents([
        { id: 123, quantity: 0, oldQuantity: 0 },
        { id: 456, quantity: 1, oldQuantity: 1 },
      ]),
    ).toEqual([]);
  });
});

describe("ACHIEVEMENT DIARY TIER COMPLETED EVENTS", () => {
  test("completion", () => {
    expect(
      checkAchievementDiaryTierCompletedEvents([
        {
          areaId: 1,
          tier: 1,
          completedCount: getAchievementDiaryTierTaskCount(1, 1) ?? 0,
          oldCompletedCount: 3,
        },
        {
          areaId: 2,
          tier: 1,
          completedCount: getAchievementDiaryTierTaskCount(2, 1) ?? 0,
          oldCompletedCount: 4,
        },
      ]),
    ).toEqual([
      {
        type: "achievement_diary_tier_completed",
        data: { areaId: 1, tier: 1 },
      },
      {
        type: "achievement_diary_tier_completed",
        data: { areaId: 2, tier: 1 },
      },
    ]);
  });

  test("not completed", () => {
    expect(
      checkAchievementDiaryTierCompletedEvents([
        { areaId: 1, tier: 1, completedCount: 4, oldCompletedCount: 3 },
      ]),
    ).toEqual([]);
  });

  test("already completed", () => {
    expect(
      checkAchievementDiaryTierCompletedEvents([
        {
          areaId: 1,
          tier: 1,
          completedCount: getAchievementDiaryTierTaskCount(1, 1) ?? 0,
          oldCompletedCount: getAchievementDiaryTierTaskCount(1, 1) ?? 0,
        },
        {
          areaId: 1,
          tier: 2,
          completedCount: getAchievementDiaryTierTaskCount(1, 2) ?? 0,
          oldCompletedCount: getAchievementDiaryTierTaskCount(1, 2) ?? 0,
        },
      ]),
    ).toEqual([]);
  });
});

describe("COMBAT ACHIEVEMENT TIER COMPLETED EVENTS", () => {
  test("completion", () => {
    expect(
      checkCombatAchievementTierCompletedEvents([
        {
          id: 1,
          completedCount: getCombatAchievementTierTaskCount(1) ?? 0,
          oldCompletedCount: 5,
        },
        {
          id: 2,
          completedCount: getCombatAchievementTierTaskCount(2) ?? 0,
          oldCompletedCount: 4,
        },
      ]),
    ).toEqual([
      { type: "combat_achievement_tier_completed", data: { tierId: 1 } },
      { type: "combat_achievement_tier_completed", data: { tierId: 2 } },
    ]);
  });

  test("not completed", () => {
    expect(
      checkCombatAchievementTierCompletedEvents([
        { id: 1, completedCount: 4, oldCompletedCount: 3 },
      ]),
    ).toEqual([]);
  });

  test("already completed", () => {
    expect(
      checkCombatAchievementTierCompletedEvents([
        {
          id: 1,
          completedCount: getCombatAchievementTierTaskCount(1) ?? 0,
          oldCompletedCount: getCombatAchievementTierTaskCount(1) ?? 0,
        },
        {
          id: 2,
          completedCount: getCombatAchievementTierTaskCount(2) ?? 0,
          oldCompletedCount: getCombatAchievementTierTaskCount(2) ?? 0,
        },
      ]),
    ).toEqual([]);
  });
});

describe("QUEST COMPLETED EVENTS", () => {
  test("completion", () => {
    expect(
      checkQuestCompletedEvents([
        { id: 1, state: QuestState.FINISHED, oldState: QuestState.NOT_STARTED },
        {
          id: 2,
          state: QuestState.FINISHED,
          oldState: QuestState.IN_PROGRESS,
        },
      ]),
    ).toEqual([
      { type: "quest_completed", data: { questId: 1 } },
      { type: "quest_completed", data: { questId: 2 } },
    ]);
  });

  test("not completed", () => {
    expect(
      checkQuestCompletedEvents([
        {
          id: 1,
          state: QuestState.NOT_STARTED,
          oldState: QuestState.NOT_STARTED,
        },
      ]),
    ).toEqual([]);
  });

  test("already completed", () => {
    expect(
      checkQuestCompletedEvents([
        {
          id: 1,
          state: QuestState.FINISHED,
          oldState: QuestState.FINISHED,
        },
        {
          id: 2,
          state: QuestState.FINISHED,
          oldState: QuestState.FINISHED,
        },
      ]),
    ).toEqual([]);
  });
});
