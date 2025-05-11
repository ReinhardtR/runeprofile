import { describe, expect, test } from "vitest";

import { QuestType } from "@runeprofile/runescape";

import {
  getAchievementDiaryTierUpdates,
  getCombatAchievementTierUpdates,
  getItemUpdates,
  getQuestUpdates,
  getSkillUpdates,
} from "~/lib/profiles/get-profile-updates";

describe("ACHIEVEMENT DIARY TIERS", () => {
  test("no changes", () => {
    expect(
      getAchievementDiaryTierUpdates(
        [
          {
            areaId: 1,
            tierIndex: 0,
            completedCount: 1,
          },
        ],
        [
          {
            areaId: 1,
            area: "Test Area",
            tierIndex: 0,
            tierName: "Test Tier",
            tasksCount: 1,
            completedCount: 1,
          },
        ],
      ),
    ).toEqual([]);
  });

  test("no progress", () => {
    expect(
      getAchievementDiaryTierUpdates(
        [
          {
            areaId: 1,
            tierIndex: 0,
            completedCount: 0,
          },
        ],
        [],
      ),
    ).toEqual([]);
  });

  test("progress", () => {
    expect(
      getAchievementDiaryTierUpdates(
        [
          { areaId: 0, tierIndex: 0, completedCount: 1 },
          { areaId: 1, tierIndex: 1, completedCount: 2 },
        ],
        [
          {
            areaId: 0,
            area: "Test Area",
            tierIndex: 0,
            tierName: "Test Tier",
            tasksCount: 1,
            completedCount: 1,
          },
          {
            areaId: 1,
            area: "Test Area 2",
            tierIndex: 1,
            tierName: "Test Tier 2",
            tasksCount: 1,
            completedCount: 1,
          },
        ],
      ),
    ).toEqual([
      {
        areaId: 1,
        tier: 1,
        completedCount: 2,
        oldCompletedCount: 1,
      },
    ]);
  });

  test("new area", () => {
    expect(
      getAchievementDiaryTierUpdates(
        [
          { areaId: 0, tierIndex: 0, completedCount: 1 },
          { areaId: 1, tierIndex: 1, completedCount: 1 },
          { areaId: 2, tierIndex: 2, completedCount: 1 },
        ],
        [
          {
            areaId: 0,
            area: "Test Area",
            tierIndex: 0,
            tierName: "Test Tier",
            tasksCount: 1,
            completedCount: 1,
          },
          {
            areaId: 1,
            area: "Test Area 2",
            tierIndex: 1,
            tierName: "Test Tier 2",
            tasksCount: 1,
            completedCount: 1,
          },
        ],
      ),
    ).toEqual([
      {
        areaId: 2,
        tier: 2,
        completedCount: 1,
        oldCompletedCount: 0,
      },
    ]);
  });

  test("unknown area", () => {
    expect(
      getAchievementDiaryTierUpdates(
        [
          { areaId: 0, tierIndex: 0, completedCount: 1 },
          { areaId: 1, tierIndex: 1, completedCount: 1 },
          { areaId: 100, tierIndex: 2, completedCount: 1 },
        ],
        [
          {
            areaId: 0,
            area: "Test Area",
            tierIndex: 0,
            tierName: "Test Tier",
            tasksCount: 1,
            completedCount: 1,
          },
          {
            areaId: 1,
            area: "Test Area 2",
            tierIndex: 1,
            tierName: "Test Tier 2",
            tasksCount: 1,
            completedCount: 1,
          },
          {
            areaId: 2,
            area: "Test Area 3",
            tierIndex: 2,
            tierName: "Test Tier 3",
            tasksCount: 1,
            completedCount: 1,
          },
        ],
      ),
    ).toEqual([]);
  });

  test("unknown tier", () => {
    expect(
      getAchievementDiaryTierUpdates(
        [
          { areaId: 0, tierIndex: 0, completedCount: 1 },
          { areaId: 1, tierIndex: 100, completedCount: 1 },
        ],
        [
          {
            areaId: 0,
            area: "Test Area",
            tierIndex: 0,
            tierName: "Test Tier",
            tasksCount: 1,
            completedCount: 1,
          },
          {
            areaId: 1,
            area: "Test Area 2",
            tierIndex: 1,
            tierName: "Test Tier 2",
            tasksCount: 1,
            completedCount: 1,
          },
        ],
      ),
    ).toEqual([]);
  });

  test("missing area", () => {
    expect(
      getAchievementDiaryTierUpdates(
        [{ areaId: 0, tierIndex: 0, completedCount: 1 }],
        [
          {
            areaId: 0,
            area: "Test Area",
            tierIndex: 0,
            tierName: "Test Tier",
            tasksCount: 1,
            completedCount: 1,
          },
          {
            areaId: 1,
            area: "Test Area 2",
            tierIndex: 0,
            tierName: "Test Tier 2",
            tasksCount: 1,
            completedCount: 1,
          },
        ],
      ),
    ).toEqual([]);
  });

  test("missing tier", () => {
    expect(
      getAchievementDiaryTierUpdates(
        [{ areaId: 0, tierIndex: 0, completedCount: 1 }],
        [
          {
            areaId: 0,
            area: "Test Area",
            tierIndex: 0,
            tierName: "Test Tier",
            tasksCount: 1,
            completedCount: 1,
          },
          {
            areaId: 0,
            area: "Test Area 2",
            tierIndex: 1,
            tierName: "Test Tier 2",
            tasksCount: 1,
            completedCount: 1,
          },
        ],
      ),
    ).toEqual([]);
  });
});

describe("COMBAT ACHIEVEMENT TIERS", () => {
  test("no changes", () => {
    expect(
      getCombatAchievementTierUpdates({ 1: 1 }, [
        { id: 1, name: "Easy", completedCount: 1, tasksCount: 1 },
      ]),
    ).toEqual([]);
  });

  test("no progress", () => {
    expect(getCombatAchievementTierUpdates({ 1: 0 }, [])).toEqual([]);
  });

  test("progress", () => {
    expect(
      getCombatAchievementTierUpdates({ 1: 1, 2: 2 }, [
        { id: 1, name: "Easy", completedCount: 1, tasksCount: 1 },
        { id: 2, name: "Medium", completedCount: 1, tasksCount: 1 },
      ]),
    ).toEqual([
      {
        id: 2,
        completedCount: 2,
        oldCompletedCount: 1,
      },
    ]);
  });

  test("new tier", () => {
    expect(
      getCombatAchievementTierUpdates({ 1: 1, 2: 1, 3: 1 }, [
        { id: 1, name: "Easy", completedCount: 1, tasksCount: 1 },
        { id: 2, name: "Medium", completedCount: 1, tasksCount: 1 },
      ]),
    ).toEqual([
      {
        id: 3,
        completedCount: 1,
        oldCompletedCount: 0,
      },
    ]);
  });

  test("unknown tier", () => {
    expect(
      getCombatAchievementTierUpdates({ 1: 1, 2: 1, 0: 1 }, [
        { id: 1, name: "Easy", completedCount: 1, tasksCount: 1 },
        { id: 2, name: "Medium", completedCount: 1, tasksCount: 1 },
      ]),
    ).toEqual([]);
  });

  test("missing tier", () => {
    expect(
      getCombatAchievementTierUpdates({ 1: 1, 2: 1 }, [
        { id: 1, name: "Easy", completedCount: 1, tasksCount: 1 },
        { id: 2, name: "Medium", completedCount: 1, tasksCount: 1 },
        { id: 3, name: "Hard", completedCount: 1, tasksCount: 1 },
      ]),
    ).toEqual([]);
  });
});

describe("ITEMS", () => {
  test("no changes", () => {
    expect(
      getItemUpdates({ 1249: 1 }, [
        { id: 1249, name: "Test Item", quantity: 1, createdAt: "" },
      ]),
    ).toEqual([]);
  });

  test("no progress", () => {
    expect(getItemUpdates({ 1249: 0 }, [])).toEqual([]);
  });

  test("progress", () => {
    expect(
      getItemUpdates({ 1249: 1, 2366: 2 }, [
        { id: 1249, name: "Test Item", quantity: 1, createdAt: "" },
        { id: 2366, name: "Test Item 2", quantity: 1, createdAt: "" },
      ]),
    ).toEqual([
      {
        id: 2366,
        quantity: 2,
        oldQuantity: 1,
      },
    ]);
  });

  test("new item", () => {
    expect(
      getItemUpdates({ 1249: 1, 2366: 1, 2577: 1 }, [
        { id: 1249, name: "Test Item", quantity: 1, createdAt: "" },
        { id: 2366, name: "Test Item 2", quantity: 1, createdAt: "" },
      ]),
    ).toEqual([
      {
        id: 2577,
        quantity: 1,
        oldQuantity: 0,
      },
    ]);
  });

  test("unknown item", () => {
    expect(
      getItemUpdates({ 1249: 1, 2366: 1, 0: 1 }, [
        { id: 1249, name: "Test Item", quantity: 1, createdAt: "" },
        { id: 2366, name: "Test Item 2", quantity: 1, createdAt: "" },
      ]),
    ).toEqual([]);
  });

  test("missing item", () => {
    expect(
      getItemUpdates({ 1249: 1, 2366: 1 }, [
        { id: 1249, name: "Test Item", quantity: 1, createdAt: "" },
        { id: 2366, name: "Test Item 2", quantity: 1, createdAt: "" },
        { id: 2577, name: "Test Item 3", quantity: 1, createdAt: "" },
      ]),
    ).toEqual([]);
  });
});

describe("QUESTS", () => {
  test("no changes", () => {
    expect(
      getQuestUpdates({ 0: 1 }, [
        {
          id: 0,
          name: "Test Quest",
          state: 1,
          type: QuestType.FREE,
        },
      ]),
    ).toEqual([]);
  });

  test("no progress", () => {
    expect(getQuestUpdates({ 0: 0 }, [])).toEqual([]);
  });

  test("progress", () => {
    expect(
      getQuestUpdates(
        {
          0: 1,
          1: 2,
        },
        [
          {
            id: 0,
            name: "Test Quest",
            state: 1,
            type: QuestType.FREE,
          },
          {
            id: 1,
            name: "Test Quest 2",
            state: 1,
            type: QuestType.FREE,
          },
        ],
      ),
    ).toEqual([
      {
        id: 1,
        state: 2,
        oldState: 1,
      },
    ]);
  });

  test("new quest", () => {
    expect(
      getQuestUpdates(
        {
          0: 1,
          1: 1,
          3: 1,
        },
        [
          {
            id: 0,
            name: "Test Quest",
            state: 1,
            type: QuestType.FREE,
          },
          {
            id: 1,
            name: "Test Quest 2",
            state: 1,
            type: QuestType.FREE,
          },
        ],
      ),
    ).toEqual([
      {
        id: 3,
        state: 1,
        oldState: 0,
      },
    ]);
  });

  test("unknown quest", () => {
    expect(
      getQuestUpdates(
        {
          0: 1,
          1: 1,
          2: 1,
        },
        [
          {
            id: 0,
            name: "Test Quest",
            state: 1,
            type: QuestType.FREE,
          },
          {
            id: 1,
            name: "Test Quest 2",
            state: 1,
            type: QuestType.FREE,
          },
          {
            id: 3,
            name: "Test Quest 3",
            state: 1,
            type: QuestType.FREE,
          },
        ],
      ),
    ).toEqual([]);
  });

  test("missing quest", () => {
    expect(
      getQuestUpdates(
        {
          0: 1,
          1: 1,
        },
        [
          {
            id: 0,
            name: "Test Quest",
            state: 1,
            type: QuestType.FREE,
          },
          {
            id: 1,
            name: "Test Quest 2",
            state: 1,
            type: QuestType.FREE,
          },
          {
            id: 3,
            name: "Test Quest 3",
            state: 1,
            type: QuestType.FREE,
          },
        ],
      ),
    ).toEqual([]);
  });
});

describe("SKILLS", () => {
  test("no changes", () => {
    expect(
      getSkillUpdates({ Attack: 1, Strength: 1 }, [
        { name: "Attack", xp: 1 },
        { name: "Strength", xp: 1 },
      ]),
    ).toEqual([]);
  });

  test("no progress", () => {
    expect(getSkillUpdates({ Attack: 0 }, [])).toEqual([]);
  });

  test("progress", () => {
    expect(
      getSkillUpdates({ Attack: 1, Strength: 2, Defence: 1 }, [
        { name: "Attack", xp: 1 },
        { name: "Strength", xp: 1 },
        { name: "Defence", xp: 1 },
      ]),
    ).toEqual([
      {
        name: "Strength",
        xp: 2,
        oldXp: 1,
      },
    ]);
  });

  test("new skill", () => {
    expect(
      getSkillUpdates({ Attack: 1, Strength: 1, Defence: 1 }, [
        { name: "Attack", xp: 1 },
        { name: "Strength", xp: 1 },
      ]),
    ).toEqual([
      {
        name: "Defence",
        xp: 1,
        oldXp: 0,
      },
    ]);
  });

  test("unknown skill", () => {
    expect(
      getSkillUpdates({ Attack: 1, Strength: 1 }, [
        { name: "Attack", xp: 1 },
        { name: "Strength", xp: 1 },
        { name: "TestSkill", xp: 1 },
      ]),
    ).toEqual([]);
  });

  test("missing skill", () => {
    expect(
      getSkillUpdates({ Attack: 1, Strength: 1 }, [
        { name: "Attack", xp: 1 },
        { name: "Strength", xp: 1 },
        { name: "Defence", xp: 1 },
      ]),
    ).toEqual([]);
  });
});
