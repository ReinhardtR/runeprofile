import { describe, expect, test } from "vitest";

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
      getAchievementDiaryTierUpdates({
        newData: [
          {
            areaId: 1,
            tierIndex: 0,
            completedCount: 1,
          },
        ],
        oldData: [
          {
            areaId: 1,
            tierIndex: 0,
            completedCount: 1,
          },
        ],
      }),
    ).toEqual([]);
  });

  test("no progress", () => {
    expect(
      getAchievementDiaryTierUpdates({
        newData: [
          {
            areaId: 1,
            tierIndex: 0,
            completedCount: 0,
          },
        ],
        oldData: [],
      }),
    ).toEqual([]);
  });

  test("progress", () => {
    expect(
      getAchievementDiaryTierUpdates({
        newData: [
          { areaId: 0, tierIndex: 0, completedCount: 1 },
          { areaId: 1, tierIndex: 1, completedCount: 2 },
        ],
        oldData: [
          {
            areaId: 0,
            tierIndex: 0,
            completedCount: 1,
          },
          {
            areaId: 1,
            tierIndex: 1,
            completedCount: 1,
          },
        ],
      }),
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
      getAchievementDiaryTierUpdates({
        newData: [
          { areaId: 0, tierIndex: 0, completedCount: 1 },
          { areaId: 1, tierIndex: 1, completedCount: 1 },
          { areaId: 2, tierIndex: 2, completedCount: 1 },
        ],
        oldData: [
          {
            areaId: 0,
            tierIndex: 0,
            completedCount: 1,
          },
          {
            areaId: 1,
            tierIndex: 1,
            completedCount: 1,
          },
        ],
      }),
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
      getAchievementDiaryTierUpdates({
        newData: [
          { areaId: 0, tierIndex: 0, completedCount: 1 },
          { areaId: 1, tierIndex: 1, completedCount: 1 },
          { areaId: 100, tierIndex: 2, completedCount: 1 },
        ],
        oldData: [
          {
            areaId: 0,
            tierIndex: 0,
            completedCount: 1,
          },
          {
            areaId: 1,
            tierIndex: 1,
            completedCount: 1,
          },
          {
            areaId: 2,
            tierIndex: 2,
            completedCount: 1,
          },
        ],
      }),
    ).toEqual([]);
  });

  test("unknown tier", () => {
    expect(
      getAchievementDiaryTierUpdates({
        newData: [
          { areaId: 0, tierIndex: 0, completedCount: 1 },
          { areaId: 1, tierIndex: 100, completedCount: 1 },
        ],
        oldData: [
          {
            areaId: 0,
            tierIndex: 0,
            completedCount: 1,
          },
          {
            areaId: 1,
            tierIndex: 1,
            completedCount: 1,
          },
        ],
      }),
    ).toEqual([]);
  });

  test("missing area", () => {
    expect(
      getAchievementDiaryTierUpdates({
        newData: [{ areaId: 0, tierIndex: 0, completedCount: 1 }],
        oldData: [
          {
            areaId: 0,
            tierIndex: 0,
            completedCount: 1,
          },
          {
            areaId: 1,
            tierIndex: 0,
            completedCount: 1,
          },
        ],
      }),
    ).toEqual([]);
  });

  test("missing tier", () => {
    expect(
      getAchievementDiaryTierUpdates({
        newData: [{ areaId: 0, tierIndex: 0, completedCount: 1 }],
        oldData: [
          {
            areaId: 0,
            tierIndex: 0,
            completedCount: 1,
          },
          {
            areaId: 0,
            tierIndex: 1,
            completedCount: 1,
          },
        ],
      }),
    ).toEqual([]);
  });

  test("regress with forceResync", () => {
    expect(
      getAchievementDiaryTierUpdates({
        newData: [{ areaId: 0, tierIndex: 0, completedCount: 1 }],
        oldData: [
          {
            areaId: 0,
            tierIndex: 0,
            completedCount: 3,
          },
        ],
        forceResync: true,
      }),
    ).toEqual([
      {
        areaId: 0,
        tier: 0,
        completedCount: 1,
        oldCompletedCount: 3,
      },
    ]);
  });

  test("regress blocked without forceResync", () => {
    expect(
      getAchievementDiaryTierUpdates({
        newData: [{ areaId: 0, tierIndex: 0, completedCount: 1 }],
        oldData: [
          {
            areaId: 0,
            tierIndex: 0,
            completedCount: 3,
          },
        ],
      }),
    ).toEqual([]);
  });
});

describe("COMBAT ACHIEVEMENT TIERS", () => {
  test("no changes", () => {
    expect(
      getCombatAchievementTierUpdates({
        newData: { 1: 1 },
        oldData: [{ id: 1, completedCount: 1 }],
      }),
    ).toEqual([]);
  });

  test("no progress", () => {
    expect(
      getCombatAchievementTierUpdates({ newData: { 1: 0 }, oldData: [] }),
    ).toEqual([]);
  });

  test("progress", () => {
    expect(
      getCombatAchievementTierUpdates({
        newData: { 1: 1, 2: 2 },
        oldData: [
          { id: 1, completedCount: 1 },
          { id: 2, completedCount: 1 },
        ],
      }),
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
      getCombatAchievementTierUpdates({
        newData: { 1: 1, 2: 1, 3: 1 },
        oldData: [
          { id: 1, completedCount: 1 },
          { id: 2, completedCount: 1 },
        ],
      }),
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
      getCombatAchievementTierUpdates({
        newData: { 1: 1, 2: 1, 0: 1 },
        oldData: [
          { id: 1, completedCount: 1 },
          { id: 2, completedCount: 1 },
        ],
      }),
    ).toEqual([]);
  });

  test("missing tier", () => {
    expect(
      getCombatAchievementTierUpdates({
        newData: { 1: 1, 2: 1 },
        oldData: [
          { id: 1, completedCount: 1 },
          { id: 2, completedCount: 1 },
          { id: 3, completedCount: 1 },
        ],
      }),
    ).toEqual([]);
  });

  test("regress with forceResync", () => {
    expect(
      getCombatAchievementTierUpdates({
        newData: { 1: 1 },
        oldData: [{ id: 1, completedCount: 5 }],
        forceResync: true,
      }),
    ).toEqual([
      {
        id: 1,
        completedCount: 1,
        oldCompletedCount: 5,
      },
    ]);
  });

  test("regress blocked without forceResync", () => {
    expect(
      getCombatAchievementTierUpdates({
        newData: { 1: 1 },
        oldData: [{ id: 1, completedCount: 5 }],
      }),
    ).toEqual([]);
  });
});

describe("ITEMS", () => {
  test("no changes", () => {
    expect(
      getItemUpdates({
        newData: { 1249: 1 },
        oldData: [{ id: 1249, quantity: 1 }],
      }),
    ).toEqual([]);
  });

  test("no progress", () => {
    expect(getItemUpdates({ newData: { 1249: 0 }, oldData: [] })).toEqual([]);
  });

  test("progress", () => {
    expect(
      getItemUpdates({
        newData: { 1249: 1, 2366: 2 },
        oldData: [
          { id: 1249, quantity: 1 },
          { id: 2366, quantity: 1 },
        ],
      }),
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
      getItemUpdates({
        newData: { 1249: 1, 2366: 1, 2577: 1 },
        oldData: [
          { id: 1249, quantity: 1 },
          { id: 2366, quantity: 1 },
        ],
      }),
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
      getItemUpdates({
        newData: { 1249: 1, 2366: 1, 0: 1 },
        oldData: [
          { id: 1249, quantity: 1 },
          { id: 2366, quantity: 1 },
        ],
      }),
    ).toEqual([]);
  });

  test("missing item", () => {
    expect(
      getItemUpdates({
        newData: { 1249: 1, 2366: 1 },
        oldData: [
          { id: 1249, quantity: 1 },
          { id: 2366, quantity: 1 },
          { id: 2577, quantity: 1 },
        ],
      }),
    ).toEqual([]);
  });
});

describe("QUESTS", () => {
  test("no changes", () => {
    expect(
      getQuestUpdates({
        newData: { 0: 1 },
        oldData: [
          {
            id: 0,
            state: 1,
          },
        ],
      }),
    ).toEqual([]);
  });

  test("no progress", () => {
    expect(getQuestUpdates({ newData: { 0: 0 }, oldData: [] })).toEqual([]);
  });

  test("progress", () => {
    expect(
      getQuestUpdates({
        newData: {
          0: 1,
          1: 2,
        },
        oldData: [
          {
            id: 0,
            state: 1,
          },
          {
            id: 1,
            state: 1,
          },
        ],
      }),
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
      getQuestUpdates({
        newData: {
          0: 1,
          1: 1,
          3: 1,
        },
        oldData: [
          {
            id: 0,
            state: 1,
          },
          {
            id: 1,
            state: 1,
          },
        ],
      }),
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
      getQuestUpdates({
        newData: {
          0: 1,
          1: 1,
          2: 1,
        },
        oldData: [
          {
            id: 0,
            state: 1,
          },
          {
            id: 1,
            state: 1,
          },
          {
            id: 3,
            state: 1,
          },
        ],
      }),
    ).toEqual([]);
  });

  test("missing quest", () => {
    expect(
      getQuestUpdates({
        newData: {
          0: 1,
          1: 1,
        },
        oldData: [
          {
            id: 0,
            state: 1,
          },
          {
            id: 1,
            state: 1,
          },
          {
            id: 3,
            state: 1,
          },
        ],
      }),
    ).toEqual([]);
  });

  test("regress with forceResync", () => {
    expect(
      getQuestUpdates({
        newData: { 0: 1 },
        oldData: [{ id: 0, state: 2 }],
        forceResync: true,
      }),
    ).toEqual([
      {
        id: 0,
        state: 1,
        oldState: 2,
      },
    ]);
  });

  test("regress blocked without forceResync", () => {
    expect(
      getQuestUpdates({
        newData: { 0: 1 },
        oldData: [{ id: 0, state: 2 }],
      }),
    ).toEqual([]);
  });
});

describe("SKILLS", () => {
  test("no changes", () => {
    expect(
      getSkillUpdates({
        newData: { Attack: 1, Strength: 1 },
        oldData: [
          { name: "Attack", xp: 1 },
          { name: "Strength", xp: 1 },
        ],
      }),
    ).toEqual([]);
  });

  test("no progress", () => {
    expect(
      getSkillUpdates({ newData: { Attack: 0 }, oldData: [] }),
    ).toEqual([]);
  });

  test("progress", () => {
    expect(
      getSkillUpdates({
        newData: { Attack: 1, Strength: 2, Defence: 1 },
        oldData: [
          { name: "Attack", xp: 1 },
          { name: "Strength", xp: 1 },
          { name: "Defence", xp: 1 },
        ],
      }),
    ).toEqual([
      {
        name: "Strength",
        xp: 2,
        oldXp: 1,
      },
    ]);
  });

  test("regress", () => {
    expect(
      getSkillUpdates({
        newData: { Attack: 4, Strength: 2, Defence: 1 },
        oldData: [
          { name: "Attack", xp: 5 },
          { name: "Strength", xp: 1 },
          { name: "Defence", xp: 1 },
        ],
      }),
    ).toEqual([
      {
        name: "Strength",
        xp: 2,
        oldXp: 1,
      },
    ]);
  });

  test("regress with forceResync", () => {
    expect(
      getSkillUpdates({
        newData: { Attack: 4, Strength: 2, Defence: 1 },
        oldData: [
          { name: "Attack", xp: 5 },
          { name: "Strength", xp: 1 },
          { name: "Defence", xp: 1 },
        ],
        forceResync: true,
      }),
    ).toEqual([
      {
        name: "Attack",
        xp: 4,
        oldXp: 5,
      },
      {
        name: "Strength",
        xp: 2,
        oldXp: 1,
      },
    ]);
  });

  test("forceResync skips unchanged skills", () => {
    expect(
      getSkillUpdates({
        newData: { Attack: 5, Strength: 1 },
        oldData: [
          { name: "Attack", xp: 5 },
          { name: "Strength", xp: 1 },
        ],
        forceResync: true,
      }),
    ).toEqual([]);
  });

  test("new skill", () => {
    expect(
      getSkillUpdates({
        newData: { Attack: 1, Strength: 1, Defence: 1 },
        oldData: [
          { name: "Attack", xp: 1 },
          { name: "Strength", xp: 1 },
        ],
      }),
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
      getSkillUpdates({
        newData: { Attack: 1, Strength: 1 },
        oldData: [
          { name: "Attack", xp: 1 },
          { name: "Strength", xp: 1 },
          { name: "TestSkill", xp: 1 },
        ],
      }),
    ).toEqual([]);
  });

  test("missing skill", () => {
    expect(
      getSkillUpdates({
        newData: { Attack: 1, Strength: 1 },
        oldData: [
          { name: "Attack", xp: 1 },
          { name: "Strength", xp: 1 },
          { name: "Defence", xp: 1 },
        ],
      }),
    ).toEqual([]);
  });
});
