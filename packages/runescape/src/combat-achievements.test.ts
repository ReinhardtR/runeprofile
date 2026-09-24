import { describe, expect, test } from "vitest";

import {
  COMBAT_ACHIEVEMENT_TASKS,
  calculateCombatAchievementPoints,
  getCombatAchievementTaskByIndex,
  getCombatAchievementTasksForAccount,
  getCombatAchievementTierReached,
  getCombatAchievementTierTaskCount,
  isCombatAchievementTaskExempt,
} from "./combat-achievements";

const NORMAL = { accountTypeId: 0 };
const gim = (gimGroupSize: number | null) => ({
  accountTypeId: 4,
  gimGroupSize,
});
const task = (index: number) => getCombatAchievementTaskByIndex(index)!;
const NIGHTMARE_5_SCALE = 196; // exempt for groups of up to 4
const TOMBS_GROUP_OF_8 = 423; // exempt for every group size

describe("GROUP IRONMAN EXEMPTIONS", () => {
  test("exempts tasks needing a bigger team than the group", () => {
    expect(isCombatAchievementTaskExempt(task(NIGHTMARE_5_SCALE), gim(4))).toBe(
      true,
    );
    expect(isCombatAchievementTaskExempt(task(NIGHTMARE_5_SCALE), gim(2))).toBe(
      true,
    );
    expect(isCombatAchievementTaskExempt(task(NIGHTMARE_5_SCALE), gim(5))).toBe(
      false,
    );
    expect(isCombatAchievementTaskExempt(task(TOMBS_GROUP_OF_8), gim(5))).toBe(
      true,
    );
  });

  test("matches the game outside groups of 2-5 and for non-GIM accounts", () => {
    for (const size of [0, 1, 6]) {
      expect(
        isCombatAchievementTaskExempt(task(TOMBS_GROUP_OF_8), gim(size)),
      ).toBe(false);
    }
    expect(isCombatAchievementTaskExempt(task(TOMBS_GROUP_OF_8), NORMAL)).toBe(
      false,
    );
    expect(
      isCombatAchievementTaskExempt(task(TOMBS_GROUP_OF_8), {
        accountTypeId: 1,
        gimGroupSize: 3,
      }),
    ).toBe(false);
  });

  test("unknown group size only exempts tasks exempt at every size", () => {
    expect(
      isCombatAchievementTaskExempt(task(NIGHTMARE_5_SCALE), gim(null)),
    ).toBe(false);
    expect(
      isCombatAchievementTaskExempt(task(TOMBS_GROUP_OF_8), gim(null)),
    ).toBe(true);
  });

  test("tier task counts shrink with the group size", () => {
    const gmTotal = getCombatAchievementTierTaskCount(6, NORMAL)!;
    const gmExempt = (size: number) =>
      COMBAT_ACHIEVEMENT_TASKS.filter(
        (t) => t.tierId === 6 && (t.gimExemptMaxGroupSize ?? 0) >= size,
      ).length;
    expect(getCombatAchievementTierTaskCount(6, gim(4))).toBe(
      gmTotal - gmExempt(4),
    );
    expect(getCombatAchievementTierTaskCount(6, gim(2))).toBe(
      gmTotal - gmExempt(2),
    );
    expect(gmExempt(2)).toBeGreaterThan(gmExempt(4));
  });

  test("a GIM with every required task reaches Grandmaster", () => {
    const account = gim(4);
    const required = getCombatAchievementTasksForAccount(account).map(
      (t) => t.index,
    );
    const points = calculateCombatAchievementPoints(required, account);
    expect(getCombatAchievementTierReached(points, account)).toBe(6);
    // The same tasks aren't enough without the exemptions.
    expect(
      getCombatAchievementTierReached(
        calculateCombatAchievementPoints(required, NORMAL),
        NORMAL,
      ),
    ).toBe(5);
  });

  test("completed exempt tasks don't award points", () => {
    expect(calculateCombatAchievementPoints([NIGHTMARE_5_SCALE], gim(4))).toBe(
      0,
    );
    expect(calculateCombatAchievementPoints([NIGHTMARE_5_SCALE], gim(5))).toBe(
      6,
    );
  });
});
