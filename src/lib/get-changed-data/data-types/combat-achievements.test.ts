import { describe, test, expect } from "vitest";
import { CombatAchievementsTierName } from "~/lib/domain/profile-data-types";
import {
  getCombatAchievementTierChanges,
  CombatAchievementTierChange,
  getAccountCombatAchievementTierChanges,
  AccountCombatAchievementTierChange,
} from "~/lib/get-changed-data/data-types/combat-achievements";

describe("getCombatAchievementTierChanges", () => {
  test("new task added to tier", () => {
    const result = getCombatAchievementTierChanges(
      [
        {
          tier: CombatAchievementsTierName.EASY,
          tasksTotal: 1,
        },
      ],
      [
        {
          tier: CombatAchievementsTierName.EASY,
          tasksTotal: 2,
        },
      ]
    );

    expect(result).toEqual<CombatAchievementTierChange[]>([
      {
        tier: CombatAchievementsTierName.EASY,
        tasksTotal: 2,
      },
    ]);
  });

  test("no changes", () => {
    const result = getCombatAchievementTierChanges(
      [
        {
          tier: CombatAchievementsTierName.EASY,
          tasksTotal: 1,
        },
      ],
      [
        {
          tier: CombatAchievementsTierName.EASY,
          tasksTotal: 1,
        },
      ]
    );

    expect(result).toEqual<CombatAchievementTierChange[]>([]);
  });
});

describe("getAccountCombatAchievementTierChanges", () => {
  test("completed a task", () => {
    const result = getAccountCombatAchievementTierChanges(
      [
        {
          tier: CombatAchievementsTierName.EASY,
          tasksCompleted: 0,
        },
      ],
      [
        {
          tier: CombatAchievementsTierName.EASY,
          tasksCompleted: 1,
        },
      ]
    );

    expect(result).toEqual<AccountCombatAchievementTierChange[]>([
      {
        tier: CombatAchievementsTierName.EASY,
        tasksCompleted: 1,
      },
    ]);
  });

  test("no changes", () => {
    const result = getAccountCombatAchievementTierChanges(
      [
        {
          tier: CombatAchievementsTierName.EASY,
          tasksCompleted: 1,
        },
      ],
      [
        {
          tier: CombatAchievementsTierName.EASY,
          tasksCompleted: 1,
        },
      ]
    );

    expect(result).toEqual<AccountCombatAchievementTierChange[]>([]);
  });
});
