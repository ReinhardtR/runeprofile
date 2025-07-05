import { describe, expect, test } from "vitest";

import {
  MAX_SKILL_LEVEL,
  MAX_SKILL_XP,
  QuestState,
  getAchievementDiaryTierTaskCount,
  getCombatAchievementTierTaskCount,
  getLevelXpThreshold,
} from "@runeprofile/runescape";

import {
  checkAchievementDiaryTierCompletedEvents,
  checkCombatAchievementTierCompletedEvents,
  checkLevelUpEvents,
  checkMaxedEvent,
  checkNewItemObtainedEvents,
  checkQuestCompletedEvents,
  checkXpMilestoneEvents,
} from "~/lib/activity-log/check-activity-events";
import { ProfileUpdates } from "~/lib/profiles/get-profile-updates";

describe("LEVEL UP EVENTS", () => {
  const maxedSkillXp = getLevelXpThreshold(MAX_SKILL_LEVEL);
  test("milestone", () => {
    expect(
      checkLevelUpEvents([
        { name: "Attack", xp: maxedSkillXp, oldXp: 11805606 }, // 98 -> 99
        { name: "Strength", xp: maxedSkillXp, oldXp: 11805606 }, // 98 -> 99
      ]),
    ).toEqual([
      { type: "level_up", data: { name: "Attack", level: 99 } },
      { type: "level_up", data: { name: "Strength", level: 99 } },
    ]);
  });

  test("milestone skip", () => {
    expect(
      checkLevelUpEvents([
        { name: "Defence", xp: maxedSkillXp, oldXp: 0 }, // 1 -> 99
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
      checkLevelUpEvents([
        { name: "Ranged", xp: maxedSkillXp, oldXp: 13034432 },
      ]), // 99 -> 99
    ).toEqual([]);
  });
});

describe("XP MILESTONE EVENTS", () => {
  test("xp milestone", () => {
    expect(
      checkXpMilestoneEvents([
        { name: "Attack", xp: 15_000_000, oldXp: 14_999_999 },
        { name: "Strength", xp: MAX_SKILL_XP, oldXp: 150_000_000 },
      ]),
    ).toEqual([
      { type: "xp_milestone", data: { name: "Attack", xp: 15_000_000 } },
      { type: "xp_milestone", data: { name: "Strength", xp: MAX_SKILL_XP } },
    ]);
  });

  test("no xp milestone", () => {
    expect(
      checkXpMilestoneEvents([
        { name: "Magic", xp: 14_999_999, oldXp: 9_000_000 },
      ]),
    ).toEqual([]);
  });

  test("should not generate xp milestone event if old xp is already at or above milestone", () => {
    expect(
      checkXpMilestoneEvents([
        { name: "Ranged", xp: 15_000_001, oldXp: 15_000_000 },
      ]),
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

describe("MAXED EVENT", () => {
  const maxedSkillXp = getLevelXpThreshold(MAX_SKILL_LEVEL);
  const level98Xp = getLevelXpThreshold(98);

  test("maxed", () => {
    expect(
      checkMaxedEvent(
        [
          { name: "Attack", xp: level98Xp },
          { name: "Hitpoints", xp: maxedSkillXp },
          { name: "Mining", xp: maxedSkillXp },
          { name: "Strength", xp: maxedSkillXp },
          { name: "Agility", xp: maxedSkillXp },
          { name: "Smithing", xp: maxedSkillXp },
          { name: "Defence", xp: maxedSkillXp },
          { name: "Herblore", xp: maxedSkillXp },
          { name: "Fishing", xp: maxedSkillXp },
          { name: "Ranged", xp: maxedSkillXp },
          { name: "Thieving", xp: maxedSkillXp },
          { name: "Cooking", xp: maxedSkillXp },
          { name: "Prayer", xp: maxedSkillXp },
          { name: "Crafting", xp: maxedSkillXp },
          { name: "Firemaking", xp: maxedSkillXp },
          { name: "Magic", xp: maxedSkillXp },
          { name: "Fletching", xp: maxedSkillXp },
          { name: "Woodcutting", xp: maxedSkillXp },
          { name: "Runecraft", xp: maxedSkillXp },
          { name: "Slayer", xp: maxedSkillXp },
          { name: "Farming", xp: maxedSkillXp },
          { name: "Construction", xp: maxedSkillXp },
          { name: "Hunter", xp: maxedSkillXp },
        ],
        [
          {
            name: "Attack",
            xp: maxedSkillXp,
            oldXp: level98Xp,
          },
        ],
      ),
    ).toEqual({
      type: "maxed",
      data: {},
    });
  });

  test("not maxed - xp up", () => {
    expect(
      checkMaxedEvent(
        [
          { name: "Attack", xp: level98Xp },
          { name: "Hitpoints", xp: maxedSkillXp },
          { name: "Mining", xp: maxedSkillXp },
          { name: "Strength", xp: maxedSkillXp },
          { name: "Agility", xp: maxedSkillXp },
          { name: "Smithing", xp: maxedSkillXp },
          { name: "Defence", xp: maxedSkillXp },
          { name: "Herblore", xp: maxedSkillXp },
          { name: "Fishing", xp: maxedSkillXp },
          { name: "Ranged", xp: maxedSkillXp },
          { name: "Thieving", xp: maxedSkillXp },
          { name: "Cooking", xp: maxedSkillXp },
          { name: "Prayer", xp: maxedSkillXp },
          { name: "Crafting", xp: maxedSkillXp },
          { name: "Firemaking", xp: maxedSkillXp },
          { name: "Magic", xp: maxedSkillXp },
          { name: "Fletching", xp: maxedSkillXp },
          { name: "Woodcutting", xp: maxedSkillXp },
          { name: "Runecraft", xp: maxedSkillXp },
          { name: "Slayer", xp: maxedSkillXp },
          { name: "Farming", xp: maxedSkillXp },
          { name: "Construction", xp: maxedSkillXp },
          { name: "Hunter", xp: maxedSkillXp },
        ],
        [
          {
            name: "Attack",
            xp: level98Xp + 1,
            oldXp: level98Xp,
          },
        ],
      ),
    ).toEqual(undefined);
  });

  test("not maxed - maxed skill", () => {
    expect(
      checkMaxedEvent(
        [
          { name: "Attack", xp: level98Xp },
          { name: "Hitpoints", xp: level98Xp },
          { name: "Mining", xp: maxedSkillXp },
          { name: "Strength", xp: maxedSkillXp },
          { name: "Agility", xp: maxedSkillXp },
          { name: "Smithing", xp: maxedSkillXp },
          { name: "Defence", xp: maxedSkillXp },
          { name: "Herblore", xp: maxedSkillXp },
          { name: "Fishing", xp: maxedSkillXp },
          { name: "Ranged", xp: maxedSkillXp },
          { name: "Thieving", xp: maxedSkillXp },
          { name: "Cooking", xp: maxedSkillXp },
          { name: "Prayer", xp: maxedSkillXp },
          { name: "Crafting", xp: maxedSkillXp },
          { name: "Firemaking", xp: maxedSkillXp },
          { name: "Magic", xp: maxedSkillXp },
          { name: "Fletching", xp: maxedSkillXp },
          { name: "Woodcutting", xp: maxedSkillXp },
          { name: "Runecraft", xp: maxedSkillXp },
          { name: "Slayer", xp: maxedSkillXp },
          { name: "Farming", xp: maxedSkillXp },
          { name: "Construction", xp: maxedSkillXp },
          { name: "Hunter", xp: maxedSkillXp },
        ],
        [
          {
            name: "Attack",
            xp: maxedSkillXp,
            oldXp: level98Xp,
          },
        ],
      ),
    ).toEqual(undefined);
  });

  test("already maxed", () => {
    expect(
      checkMaxedEvent(
        [
          { name: "Attack", xp: maxedSkillXp },
          { name: "Hitpoints", xp: level98Xp },
          { name: "Mining", xp: maxedSkillXp },
          { name: "Strength", xp: maxedSkillXp },
          { name: "Agility", xp: maxedSkillXp },
          { name: "Smithing", xp: maxedSkillXp },
          { name: "Defence", xp: maxedSkillXp },
          { name: "Herblore", xp: maxedSkillXp },
          { name: "Fishing", xp: maxedSkillXp },
          { name: "Ranged", xp: maxedSkillXp },
          { name: "Thieving", xp: maxedSkillXp },
          { name: "Cooking", xp: maxedSkillXp },
          { name: "Prayer", xp: maxedSkillXp },
          { name: "Crafting", xp: maxedSkillXp },
          { name: "Firemaking", xp: maxedSkillXp },
          { name: "Magic", xp: maxedSkillXp },
          { name: "Fletching", xp: maxedSkillXp },
          { name: "Woodcutting", xp: maxedSkillXp },
          { name: "Runecraft", xp: maxedSkillXp },
          { name: "Slayer", xp: maxedSkillXp },
          { name: "Farming", xp: maxedSkillXp },
          { name: "Construction", xp: maxedSkillXp },
          { name: "Hunter", xp: maxedSkillXp },
        ],
        [
          {
            name: "Attack",
            xp: maxedSkillXp + 1,
            oldXp: maxedSkillXp,
          },
        ],
      ),
    ).toEqual(undefined);
  });
});
