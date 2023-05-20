import { type ChangedAccountData } from "~/lib/changed-data-algo";
import { type FullAccountWithAccountHash } from "~/lib/domain/profile-data-types";
import { type PluginAccountData } from "~/lib/plugin-data-schema";

export const oldAccountData: FullAccountWithAccountHash = {
  accountHash: "testAccountHash",
  username: "testOldName",
  accountType: "HARDCORE_IRONMAN",
  description: "testDescription",
  modelUri: "testModelUri",
  createdAt: new Date(),
  updatedAt: new Date(),
  combatLevel: 50,
  skills: [
    {
      index: 0,
      name: "Attack",
      xp: 100,
    },
    {
      index: 1,
      name: "Strength",
      xp: 200,
    },
  ],
  questList: {
    points: 50,
    quests: [
      {
        index: 0,
        name: "testQuest",
        state: "NOT_STARTED",
        type: "P2P",
      },
      {
        index: 1,
        name: "testQuest2",
        state: "FINISHED",
        type: "P2P",
      },
    ],
  },
  achievementDiaries: [
    {
      area: "Ardougne",
      tiers: [
        {
          tier: "EASY",
          completed: 1,
          total: 10,
        },
        {
          tier: "MEDIUM",
          completed: 1,
          total: 1,
        },
        {
          tier: "HARD",
          completed: 1,
          total: 1,
        },
        {
          tier: "ELITE",
          completed: 1,
          total: 1,
        },
      ],
    },
  ],
  combatAchievements: [
    {
      tier: "EASY",
      completed: 1,
      total: 10,
    },
    {
      tier: "MEDIUM",
      completed: 1,
      total: 1,
    },
    {
      tier: "HARD",
      completed: 1,
      total: 1,
    },
    {
      tier: "ELITE",
      completed: 1,
      total: 1,
    },
    {
      tier: "MASTER",
      completed: 1,
      total: 1,
    },
    {
      tier: "GRANDMASTER",
      completed: 1,
      total: 1,
    },
  ],
  hiscores: [
    {
      type: "NORMAL",
      skills: [
        {
          index: 0,
          name: "Attack",
          rank: 1,
          level: 1,
          xp: 1,
        },
        {
          index: 1,
          name: "Strength",
          rank: 1,
          level: 1,
          xp: 1,
        },
      ],
      activities: [],
      bosses: [],
    },
    {
      type: "IRONMAN",
      skills: [],
      activities: [],
      bosses: [],
    },
    {
      type: "HARDCORE",
      skills: [],
      activities: [],
      bosses: [],
    },
    {
      type: "ULTIMATE",
      skills: [],
      activities: [],
      bosses: [],
    },
  ],
  collectionLog: {
    uniqueItemsObtained: 1,
    uniqueItemsTotal: 10,
    tabs: [
      {
        name: "Bosses",
        entries: [
          {
            index: 0,
            name: "Abyssal Sire",
            items: [
              {
                id: 1,
                index: 0,
                name: "Abyssal whip",
                quantity: 0,
              },
            ],
            killCounts: [
              {
                index: 0,
                name: "Abyssal Sires killed",
                count: 5,
              },
            ],
            isCompleted: false,
          },
        ],
      },
    ],
  },
};

export const newAccountData: PluginAccountData = {
  accountHash: "testAccountHash",
  username: "testNewName",
  accountType: "IRONMAN",
  description: "testDescription",
  combatLevel: 100,
  skills: [
    {
      index: 0,
      name: "Attack",
      xp: 200,
    },
    {
      index: 1,
      name: "Strength",
      xp: 200,
    },
    {
      index: 2,
      name: "Defence",
      xp: 300,
    },
  ],
  questList: {
    points: 80,
    quests: [
      {
        index: 0,
        name: "testQuest",
        state: "IN_PROGRESS",
        type: "P2P",
      },
      {
        index: 1,
        name: "testQuest2",
        state: "FINISHED",
        type: "P2P",
      },
    ],
  },
  achievementDiaries: [
    {
      area: "Ardougne",
      Easy: {
        completed: 1,
        total: 10,
      },
      Medium: {
        completed: 1,
        total: 1,
      },
      Hard: {
        completed: 1,
        total: 1,
      },
      Elite: {
        completed: 1,
        total: 1,
      },
    },
    {
      area: "Kandarin",
      Easy: {
        completed: 2,
        total: 2,
      },
      Medium: {
        completed: 1,
        total: 1,
      },
      Hard: {
        completed: 1,
        total: 1,
      },
      Elite: {
        completed: 1,
        total: 1,
      },
    },
  ],
  combatAchievements: {
    Easy: {
      completed: 5,
      total: 10,
    },
    Medium: {
      completed: 1,
      total: 1,
    },
    Hard: {
      completed: 1,
      total: 1,
    },
    Elite: {
      completed: 1,
      total: 1,
    },
    Master: {
      completed: 1,
      total: 1,
    },
    Grandmaster: {
      completed: 1,
      total: 1,
    },
  },
  hiscores: {
    normal: {
      skills: [
        {
          index: 0,
          name: "Attack",
          rank: 1,
          level: 1,
          xp: 10,
        },
        {
          index: 1,
          name: "Strength",
          rank: 1,
          level: 1,
          xp: 1,
        },
      ],
      activities: [],
      bosses: [],
    },
    ironman: {
      skills: [],
      activities: [],
      bosses: [],
    },
    hardcore: {
      skills: [],
      activities: [],
      bosses: [],
    },
    ultimate: {
      skills: [],
      activities: [],
      bosses: [],
    },
  },
  collectionLog: {
    uniqueItemsObtained: 5,
    uniqueItemsTotal: 10,
    tabs: {
      Bosses: {
        "Abyssal Sire": {
          index: 0,
          items: [
            {
              index: 0,
              id: 1,
              name: "Abyssal Whip",
              quantity: 1,
            },
          ],
          killCounts: [
            {
              index: 0,
              name: "Abyssal Sires killed",
              count: 10,
            },
          ],
        },
      },
    },
  },
};

export const changedAccountData: ChangedAccountData = {
  _accountHash: "testAccountHash",
  account: {
    username: "testNewName",
    accountType: "IRONMAN",
    combatLevel: 100,
  },
  skills: [
    {
      index: 0,
      name: "Attack",
      xp: 200,
    },
    {
      index: 2,
      name: "Defence",
      xp: 300,
    },
  ],
  questList: {
    points: 80,
  },
  quests: [
    {
      index: 0,
      name: "testQuest",
      state: "IN_PROGRESS",
      type: "P2P",
    },
  ],
  achievementDiaries: [
    {
      area: "Kandarin",
    },
  ],
  achievementDiaryTiers: [
    {
      area: "Kandarin",
      tier: "EASY",
      completed: 2,
      total: 2,
    },
    {
      area: "Kandarin",
      tier: "MEDIUM",
      completed: 1,
      total: 1,
    },
    {
      area: "Kandarin",
      tier: "HARD",
      completed: 1,
      total: 1,
    },
    {
      area: "Kandarin",
      tier: "ELITE",
      completed: 1,
      total: 1,
    },
  ],
  combatAchievementTiers: [
    {
      tier: "EASY",
      completed: 5,
      total: 10,
    },
  ],
  hiscoresSkills: [
    {
      index: 0,
      name: "Attack",
      rank: 1,
      level: 1,
      xp: 10,
      leaderboardType: "NORMAL",
    },
  ],
  collectionLog: {
    uniqueItemsObtained: 5,
    uniqueItemsTotal: 10,
  },
  collectionLogEntryKillCounts: [
    {
      tabName: "Bosses",
      entryName: "Abyssal Sire",
      index: 0,
      name: "Abyssal Sires killed",
      count: 10,
    },
  ],
  collectionLogItems: [
    {
      tabName: "Bosses",
      entryName: "Abyssal Sire",
      index: 0,
      id: 1,
      name: "Abyssal Whip",
      quantity: 1,
    },
  ],
  collectionLogObtainedAt: [
    {
      tabName: "Bosses",
      entryName: "Abyssal Sire",
      itemId: 1,
    },
  ],
  collectionLogObtainedAtKillCounts: [
    {
      tabName: "Bosses",
      entryName: "Abyssal Sire",
      itemId: 1,
      name: "Abyssal Sires killed",
      count: 10,
      index: 0,
    },
  ],
};
