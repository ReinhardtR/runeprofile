import { describe, expect, test } from "vitest";

import { AchievementDiaryTierName } from "~/lib/domain/profile-data-types";
import {
  AccountAchievementDiaryTierChange,
  AchievementDiaryTierChange,
  getAccountAchievementDiaryTierChanges,
  getAchievementDiaryTierChanges,
} from "~/lib/get-changed-data/data-types/achievement-diaries";

describe("getAchievementDiaryTierChanges", () => {
  test("new task added", () => {
    const result = getAchievementDiaryTierChanges(
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksTotal: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksTotal: 0,
            },
          ],
        },
      ],
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksTotal: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksTotal: 1,
            },
          ],
        },
      ]
    );

    expect(result).toEqual<AchievementDiaryTierChange[]>([
      {
        area: "TestArea",
        tier: AchievementDiaryTierName.MEDIUM,
        tasksTotal: 1,
      },
    ]);
  });

  test("new tier added", () => {
    const result = getAchievementDiaryTierChanges(
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksTotal: 0,
            },
          ],
        },
      ],
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksTotal: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksTotal: 0,
            },
          ],
        },
      ]
    );

    expect(result).toEqual<AchievementDiaryTierChange[]>([
      {
        area: "TestArea",
        tier: AchievementDiaryTierName.MEDIUM,
        tasksTotal: 0,
      },
    ]);
  });

  test("new area added", () => {
    const result = getAchievementDiaryTierChanges(
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksTotal: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksTotal: 0,
            },
          ],
        },
      ],
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksTotal: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksTotal: 0,
            },
          ],
        },
        {
          area: "NewArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksTotal: 0,
            },
          ],
        },
      ]
    );

    expect(result).toEqual<AchievementDiaryTierChange[]>([
      {
        area: "NewArea",
        tier: AchievementDiaryTierName.EASY,
        tasksTotal: 0,
      },
    ]);
  });

  test("no changes", () => {
    const result = getAchievementDiaryTierChanges(
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksTotal: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksTotal: 0,
            },
          ],
        },
      ],
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksTotal: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksTotal: 0,
            },
          ],
        },
      ]
    );

    expect(result).toEqual<AchievementDiaryTierChange[]>([]);
  });
});

describe("getAccountAchievementDiaryTierChanges", () => {
  test("new task tracked", () => {
    const result = getAccountAchievementDiaryTierChanges(
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksCompleted: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksCompleted: 0,
            },
          ],
        },
      ],
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksCompleted: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksCompleted: 1,
            },
          ],
        },
      ]
    );

    expect(result).toEqual<AccountAchievementDiaryTierChange[]>([
      {
        area: "TestArea",
        tier: AchievementDiaryTierName.MEDIUM,
        tasksCompleted: 1,
      },
    ]);
  });

  test("new tier tracked", () => {
    const result = getAccountAchievementDiaryTierChanges(
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksCompleted: 0,
            },
          ],
        },
      ],
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksCompleted: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksCompleted: 0,
            },
          ],
        },
      ]
    );

    expect(result).toEqual<AccountAchievementDiaryTierChange[]>([
      {
        area: "TestArea",
        tier: AchievementDiaryTierName.MEDIUM,
        tasksCompleted: 0,
      },
    ]);
  });

  test("new area tracked", () => {
    const result = getAccountAchievementDiaryTierChanges(
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksCompleted: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksCompleted: 0,
            },
          ],
        },
      ],
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksCompleted: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksCompleted: 0,
            },
          ],
        },
        {
          area: "NewArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksCompleted: 0,
            },
          ],
        },
      ]
    );

    expect(result).toEqual<AccountAchievementDiaryTierChange[]>([
      {
        area: "NewArea",
        tier: AchievementDiaryTierName.EASY,
        tasksCompleted: 0,
      },
    ]);
  });

  test("no changes", () => {
    const result = getAccountAchievementDiaryTierChanges(
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksCompleted: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksCompleted: 0,
            },
          ],
        },
      ],
      [
        {
          area: "TestArea",
          tiers: [
            {
              name: AchievementDiaryTierName.EASY,
              tasksCompleted: 0,
            },
            {
              name: AchievementDiaryTierName.MEDIUM,
              tasksCompleted: 0,
            },
          ],
        },
      ]
    );

    expect(result).toEqual<AccountAchievementDiaryTierChange[]>([]);
  });
});
