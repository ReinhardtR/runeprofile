import { describe, test, expect } from "vitest";
import { ProfileFullWithHash } from "~/lib/domain/profile-data-types";
import { ChangedDataResult, getChangedData } from "~/lib/get-changed-data";
import { PluginData } from "~/lib/domain/plugin-data-schema";

describe("getChangedData", () => {
  test("profile update example", () => {
    const oldData: ProfileFullWithHash = {
      accountHash: "123",
      username: "PGN",
      accountType: "IRONMAN",
      description: "Old description",
      modelUri: null,
      createdAt: new Date("2021-01-01"),
      updatedAt: new Date("2021-01-01"),
      skills: [
        {
          name: "Attack",
          xp: 1000,
          orderIdx: 0,
        },
        {
          name: "Strength",
          xp: 1000,
          orderIdx: 1,
        },
      ],
      questList: {
        points: 100,
        quests: [
          {
            name: "Cook's Assistant",
            state: "IN_PROGRESS",
            type: "F2P",
            orderIdx: 0,
          },
          {
            name: "Dragon Slayer",
            state: "FINISHED",
            type: "UNKNOWN",
            orderIdx: 1,
          },
          {
            name: "Monkey Madness",
            state: "NOT_STARTED",
            type: "P2P",
            orderIdx: 2,
          },
        ],
      },
      achievementDiaries: [
        {
          area: "Karamja",
          tiers: [
            {
              name: "EASY",
              tasksCompleted: 1,
              tasksTotal: 4,
            },
          ],
        },
        {
          area: "Varrock",
          tiers: [
            {
              name: "EASY",
              tasksCompleted: 2,
              tasksTotal: 7,
            },
          ],
        },
      ],
      combatAchievements: [
        {
          tier: "EASY",
          tasksCompleted: 1,
          tasksTotal: 5,
        },
        {
          tier: "MEDIUM",
          tasksCompleted: 0,
          tasksTotal: 5,
        },
      ],
      hiscores: [
        {
          gameMode: "NORMAL",
          entries: [
            {
              activity: "Overall",
              rank: 1,
              score: 1000,
              orderIdx: 0,
            },
            {
              activity: "Attack",
              rank: 8,
              score: 1000,
              orderIdx: 1,
            },
            {
              activity: "Strength",
              rank: 2,
              score: 2000,
              orderIdx: 2,
            },
          ],
        },
      ],
      collectionLog: {
        uniqueItemsObtained: 1,
        uniqueItemsTotal: 2,
        tabs: [
          {
            name: "Bosses",
            pages: [
              {
                name: "Abyssal Sire",
                killCounts: [
                  {
                    label: "Abyssal Sire kills",
                    count: 1,
                    orderIdx: 0,
                  },
                  {
                    label: "Abyssal Demon kills",
                    count: 1,
                    orderIdx: 1,
                  },
                ],
                itemIds: [1, 2],
                orderIdx: 0,
              },
              {
                name: "Alchemical Hydra",
                killCounts: [
                  {
                    label: "Alchemical Hydra kills",
                    count: 1,
                    orderIdx: 0,
                  },
                ],
                itemIds: [4],
                orderIdx: 1,
              },
            ],
            orderIdx: 0,
          },
        ],
        items: [
          {
            id: 1,
            name: "Abyssal whip",
            quantity: 1,
            obtainedAt: {
              timestamp: new Date("2021-01-01"),
              killCounts: [
                {
                  label: "Abyssal Sire kills",
                  count: 1,
                  orderIdx: 0,
                },
              ],
            },
          },
          {
            id: 2,
            name: "Abyssal dagger",
            quantity: 0,
          },
          {
            id: 4,
            name: "Hydra's claw",
            quantity: 1,
          },
        ],
      },
    };

    const newData: PluginData = {
      accountHash: "123",
      username: "PGN",
      accountType: "NORMAL",
      description: "New description",
      skills: [
        {
          name: "Attack",
          xp: 1000,
          orderIdx: 0,
        },
        {
          name: "Strength",
          xp: 2000,
          orderIdx: 1,
        },
        {
          name: "Defence",
          xp: 1000,
          orderIdx: 2,
        },
      ],
      questList: {
        points: 200,
        quests: [
          {
            name: "Cook's Assistant",
            state: "FINISHED",
            type: "F2P",
            orderIdx: 0,
          },
          {
            name: "Dragon Slayer",
            state: "FINISHED",
            type: "F2P",
            orderIdx: 1,
          },
          {
            name: "Monkey Madness",
            state: "NOT_STARTED",
            type: "P2P",
            orderIdx: 2,
          },
          {
            name: "Desert Treasure",
            state: "NOT_STARTED",
            type: "P2P",
            orderIdx: 3,
          },
        ],
      },
      achievementDiaries: [
        {
          area: "Karamja",
          tiers: [
            {
              name: "EASY",
              tasksCompleted: 2,
              tasksTotal: 4,
            },
            {
              name: "MEDIUM",
              tasksCompleted: 0,
              tasksTotal: 5,
            },
          ],
        },
        {
          area: "Varrock",
          tiers: [
            {
              name: "EASY",
              tasksCompleted: 2,
              tasksTotal: 7,
            },
          ],
        },
        {
          area: "Ardougne",
          tiers: [
            {
              name: "EASY",
              tasksCompleted: 1,
              tasksTotal: 5,
            },
          ],
        },
      ],
      combatAchievements: [
        {
          tier: "EASY",
          tasksCompleted: 2,
          tasksTotal: 5,
        },
        {
          tier: "MEDIUM",
          tasksCompleted: 0,
          tasksTotal: 5,
        },
        {
          tier: "HARD",
          tasksCompleted: 0,
          tasksTotal: 5,
        },
      ],
      hiscores: [
        {
          gameMode: "NORMAL",
          activities: [
            {
              name: "Overall",
              rank: 1,
              score: 1000,
              orderIdx: 0,
            },
            {
              name: "Attack",
              rank: 1,
              score: 2000,
              orderIdx: 1,
            },
            {
              name: "Strength",
              rank: 2,
              score: 2000,
              orderIdx: 2,
            },
            {
              name: "Defence",
              rank: 3,
              score: 1000,
              orderIdx: 3,
            },
          ],
        },
        {
          gameMode: "IRONMAN",
          activities: [
            {
              name: "Overall",
              rank: 1,
              score: 1000,
              orderIdx: 0,
            },
          ],
        },
      ],
      collectionLog: {
        uniqueItemsObtained: 2,
        uniqueItemsTotal: 3,
        tabs: [
          {
            name: "Bosses",
            orderIdx: 0,
            pages: [
              {
                name: "Abyssal Sire",
                orderIdx: 0,
                killCounts: [
                  {
                    label: "Abyssal Sire kills",
                    count: 2,
                    orderIdx: 0,
                  },
                  {
                    label: "Abyssal Demon kills",
                    count: 1,
                    orderIdx: 1,
                  },
                  {
                    label: "Abyssal Spawn kills",
                    count: 0,
                    orderIdx: 2,
                  },
                ],
                items: [
                  {
                    id: 1,
                    name: "Abyssal whip",
                    quantity: 1,
                    orderIdx: 0,
                  },
                  {
                    id: 2,
                    name: "Abyssal dagger",
                    quantity: 1,
                    orderIdx: 1,
                  },
                  {
                    id: 3,
                    name: "Abyssal bludgeon",
                    quantity: 0,
                    orderIdx: 2,
                  },
                ],
              },
              {
                name: "Alchemical Hydra",
                orderIdx: 1,
                killCounts: [
                  {
                    label: "Alchemical Hydra kills",
                    count: 1,
                    orderIdx: 0,
                  },
                ],
                items: [
                  {
                    id: 4,
                    name: "Hydra's claw",
                    quantity: 1,
                    orderIdx: 0,
                  },
                ],
              },
              {
                name: "Barrows Chests",
                orderIdx: 2,
                killCounts: [
                  {
                    label: "Barrows Chests opened",
                    count: 0,
                    orderIdx: 0,
                  },
                ],
                items: [
                  {
                    id: 5,
                    name: "Ahrim's hood",
                    quantity: 0,
                    orderIdx: 0,
                  },
                ],
              },
            ],
          },
          {
            name: "Raids",
            orderIdx: 1,
            pages: [
              {
                name: "Chambers of Xeric",
                orderIdx: 0,
                killCounts: [
                  {
                    label: "Chambers of Xeric completions",
                    count: 0,
                    orderIdx: 0,
                  },
                ],
                items: [
                  {
                    id: 6,
                    name: "Twisted bow",
                    quantity: 0,
                    orderIdx: 0,
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const changedData = getChangedData(oldData, newData);

    expect(changedData).toEqual<ChangedDataResult>({
      account: {
        accountHash: "123",
        account: {
          username: "PGN",
          accountType: "NORMAL",
        },
        skills: [
          {
            name: "Strength",
            xp: 2000,
          },
          {
            name: "Defence",
            xp: 1000,
          },
        ],
        questList: {
          points: 200,
        },
        quests: [
          {
            name: "Cook's Assistant",
            state: "FINISHED",
          },
          {
            name: "Desert Treasure",
            state: "NOT_STARTED",
          },
        ],
        achievementDiaries: [
          {
            area: "Karamja",
            tier: "EASY",
            tasksCompleted: 2,
          },
          {
            area: "Karamja",
            tier: "MEDIUM",
            tasksCompleted: 0,
          },
          {
            area: "Ardougne",
            tier: "EASY",
            tasksCompleted: 1,
          },
        ],
        combatAchievements: [
          {
            tier: "EASY",
            tasksCompleted: 2,
          },
          {
            tier: "HARD",
            tasksCompleted: 0,
          },
        ],
        hiscoresActivities: [
          {
            gameMode: "NORMAL",
            name: "Attack",
            rank: 1,
            score: 2000,
          },
          {
            gameMode: "NORMAL",
            name: "Defence",
            rank: 3,
            score: 1000,
          },
          {
            gameMode: "IRONMAN",
            name: "Overall",
            rank: 1,
            score: 1000,
          },
        ],
        collectionLogItems: [
          {
            itemId: 2,
            quantity: 1,
            newlyObtained: {
              kcs: [
                {
                  label: "Abyssal Sire kills",
                  count: 2,
                },
                {
                  label: "Abyssal Demon kills",
                  count: 1,
                },
                {
                  label: "Abyssal Spawn kills",
                  count: 0,
                },
              ],
            },
          },
          {
            itemId: 3,
            quantity: 0,
          },
          {
            itemId: 5,
            quantity: 0,
          },
          {
            itemId: 6,
            quantity: 0,
          },
        ],
        collectionLogPageKillCounts: [
          {
            label: "Abyssal Sire kills",
            count: 2,
          },
          {
            label: "Abyssal Spawn kills",
            count: 0,
          },
          {
            label: "Barrows Chests opened",
            count: 0,
          },
          {
            label: "Chambers of Xeric completions",
            count: 0,
          },
        ],
      },
      game: {
        skills: [
          {
            name: "Defence",
            orderIdx: 2,
          },
        ],
        quests: [
          {
            name: "Dragon Slayer",
            type: "F2P",
            orderIdx: 1,
          },
          {
            name: "Desert Treasure",
            type: "P2P",
            orderIdx: 3,
          },
        ],
        achievementDiaries: [
          {
            area: "Karamja",
            tier: "MEDIUM",
            tasksTotal: 5,
          },
          {
            area: "Ardougne",
            tier: "EASY",
            tasksTotal: 5,
          },
        ],
        combatAchievements: [
          {
            tier: "HARD",
            tasksTotal: 5,
          },
        ],
        hiscoresActivities: [
          {
            gameMode: "NORMAL",
            name: "Defence",
            orderIdx: 3,
          },
          {
            gameMode: "IRONMAN",
            name: "Overall",
            orderIdx: 0,
          },
        ],
        collectionLogPages: [
          {
            tabName: "Bosses",
            pageName: "Barrows Chests",
            orderIdx: 2,
          },
          {
            tabName: "Raids",
            pageName: "Chambers of Xeric",
            orderIdx: 0,
          },
        ],
        collectionLogItems: [
          {
            id: 3,
            name: "Abyssal bludgeon",
          },
          {
            id: 5,
            name: "Ahrim's hood",
          },
          {
            id: 6,
            name: "Twisted bow",
          },
        ],
        collectionLogPageKillCounts: [
          {
            pageName: "Abyssal Sire",
            label: "Abyssal Spawn kills",
            orderIdx: 2,
          },
          {
            pageName: "Barrows Chests",
            label: "Barrows Chests opened",
            orderIdx: 0,
          },
          {
            pageName: "Chambers of Xeric",
            label: "Chambers of Xeric completions",
            orderIdx: 0,
          },
        ],
        collectionLogPageItems: [
          {
            pageName: "Abyssal Sire",
            itemId: 3,
            orderIdx: 2,
          },
          {
            pageName: "Barrows Chests",
            itemId: 5,
            orderIdx: 0,
          },
          {
            pageName: "Chambers of Xeric",
            itemId: 6,
            orderIdx: 0,
          },
        ],
      },
    });
  });
});
