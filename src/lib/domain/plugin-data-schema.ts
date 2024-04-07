import { z } from "zod";

import {
  AchievementDiaryTierName,
  CombatAchievementsTierName,
  HiscoresGameMode,
} from "~/lib/domain/profile-data-types";

import {
  QUEST_TYPE_MAP,
  QuestState,
  QuestType,
  RFD_QUESTS,
} from "../constants/quests";

const AccountType = {
  NORMAL: "NORMAL",
  IRONMAN: "IRONMAN",
  HARDCORE_IRONMAN: "HARDCORE_IRONMAN",
  ULTIMATE_IRONMAN: "ULTIMATE_IRONMAN",
  GROUP_IRONMAN: "GROUP_IRONMAN",
  HARDCORE_GROUP_IRONMAN: "HARDCORE_GROUP_IRONMAN",
  UNRANKED_GROUP_IRONMAN: "UNRANKED_GROUP_IRONMAN",
} as const;
type AccountType = keyof typeof AccountType;

const CollectionLogItemSchema = z.object({
  index: z.number(),
  id: z.number(),
  name: z.string(),
  quantity: z.number(),
});

const KillCountSchema = z.object({
  index: z.number(),
  name: z.string(),
  count: z.number(),
});

const CollectionLogEntrySchema = z.object({
  index: z.number(),
  items: z.array(CollectionLogItemSchema),
  killCounts: z.array(KillCountSchema).optional(),
});

const CollectionLogTabSchema = z.record(CollectionLogEntrySchema);

const CollectionLogSchema = z.object({
  uniqueItemsObtained: z.number(),
  uniqueItemsTotal: z.number(),
  tabs: z.record(CollectionLogTabSchema),
});

const QuestSchema = z.object({
  name: z.string(),
  state: z.nativeEnum(QuestState),
});

type QuestsArray = {
  index: number;
  name: string;
  state: QuestState;
  type: QuestType;
}[];

const QuestListSchema = z.object({
  points: z.number(),
  quests: z.array(QuestSchema).transform((quests) => {
    const questsMap = new Map<string, QuestState>(
      quests.map((quest) => [quest.name, quest.state])
    );

    const questsArray: QuestsArray = [];

    let index = 0;
    for (const [name, type] of Object.entries(QUEST_TYPE_MAP)) {
      const state = questsMap.get(name);

      if (!state) {
        continue;
      }

      questsArray.push({
        index,
        name,
        state,
        type,
      });

      index++;

      questsMap.delete(name);
    }

    for (const [name, state] of questsMap) {
      const isRFDQuest = Object.hasOwn(RFD_QUESTS, name);

      if (isRFDQuest) {
        continue;
      }

      questsArray.push({ index: -1, name, state, type: QuestType.UNKNOWN });
    }

    return questsArray;
  }),
});

const SkillsSchema = z.array(
  z.object({ index: z.number(), name: z.string(), xp: z.number() })
);

const CompletedAndTotalSchema = z.object({
  completed: z.number(),
  total: z.number(),
});

const AchievementDiariesSchema = z.array(
  z.object({
    area: z.string(),
    Easy: CompletedAndTotalSchema,
    Medium: CompletedAndTotalSchema,
    Hard: CompletedAndTotalSchema,
    Elite: CompletedAndTotalSchema,
  })
);

const CombatAchievementsSchema = z.object({
  Easy: CompletedAndTotalSchema,
  Medium: CompletedAndTotalSchema,
  Hard: CompletedAndTotalSchema,
  Elite: CompletedAndTotalSchema,
  Master: CompletedAndTotalSchema,
  Grandmaster: CompletedAndTotalSchema,
});

const HiscoresSkillsSchema = z.array(
  z.object({
    index: z.number(),
    name: z.string(),
    rank: z.number(),
    level: z.number(),
    xp: z.number(),
  })
);
export type HiscoresSkillSchemaType = z.infer<
  typeof HiscoresSkillsSchema
>[number];

const HiscoresActivitiesSchema = z.array(
  z.object({
    index: z.number(),
    name: z.string(),
    rank: z.number(),
    score: z.number(),
  })
);
export type HiscoresActivitySchemaType = z.infer<
  typeof HiscoresActivitiesSchema
>[number];

const HiscoresBossesSchema = z.array(
  z.object({
    index: z.number(),
    name: z.string(),
    rank: z.number(),
    kills: z.number(),
  })
);
export type HiscoresBossSchemaType = z.infer<
  typeof HiscoresBossesSchema
>[number];

export type HiscoresElementSchemaType =
  | HiscoresActivitySchemaType
  | HiscoresBossSchemaType
  | HiscoresSkillSchemaType;

const HiscoresLeaderboardSchema = z.object({
  skills: HiscoresSkillsSchema,
  activities: HiscoresActivitiesSchema,
  bosses: HiscoresBossesSchema,
});

const HiscoresSchema = z.object({
  normal: HiscoresLeaderboardSchema,
  ironman: HiscoresLeaderboardSchema,
  hardcore: HiscoresLeaderboardSchema,
  ultimate: HiscoresLeaderboardSchema,
});

export const PlayerDataSchema = z.object({
  accountHash: z.string(),
  username: z.string(),
  accountType: z.nativeEnum(AccountType),
  description: z.string(),
  combatLevel: z.number(),
  skills: SkillsSchema,
  questList: QuestListSchema,
  achievementDiaries: AchievementDiariesSchema,
  combatAchievements: CombatAchievementsSchema,
  hiscores: HiscoresSchema,
  collectionLog: CollectionLogSchema,
});

export type PluginDataRaw = z.infer<typeof PlayerDataSchema>;

export function getFormattedPluginData(pluginData: PluginDataRaw) {
  const account = {
    accountHash: pluginData.accountHash,
    username: pluginData.username,
    accountType: pluginData.accountType,
    description: pluginData.description,
  };

  const skills = pluginData.skills.map((skill) => ({
    name: skill.name,
    xp: skill.xp,
    orderIdx: skill.index,
  }));

  const questList = {
    points: pluginData.questList.points,
    quests: pluginData.questList.quests.map((quest) => ({
      name: quest.name,
      type: quest.type,
      state: quest.state,
      orderIdx: quest.index,
    })),
  };

  const achievementDiaries = pluginData.achievementDiaries.map((diary) => {
    const { area, ...tiers } = diary;

    return {
      area,
      tiers: Object.entries(tiers).map(([name, { completed, total }]) => ({
        name: name.toUpperCase() as AchievementDiaryTierName,
        tasksTotal: total,
        tasksCompleted: completed,
      })),
    };
  });

  const combatAchievements = Object.entries(pluginData.combatAchievements).map(
    ([tierName, data]) => ({
      tier: tierName.toUpperCase() as CombatAchievementsTierName,
      tasksTotal: data.total,
      tasksCompleted: data.completed,
    })
  );

  const hiscores = Object.entries(pluginData.hiscores).map(
    ([gameMode, data]) => ({
      gameMode: gameMode.toUpperCase() as HiscoresGameMode,
      activities: [
        ...data.skills.map((skill) => ({
          name: skill.name,
          rank: skill.rank,
          score: skill.xp,
          orderIdx: skill.index,
        })),
        ...data.activities.map((activity) => ({
          name: activity.name,
          rank: activity.rank,
          score: activity.score,
          orderIdx: activity.index,
        })),
        ...data.bosses.map((boss) => ({
          name: boss.name,
          rank: boss.rank,
          score: boss.kills,
          orderIdx: boss.index,
        })),
      ],
    })
  );

  const collectionLog = {
    uniqueItemsTotal: pluginData.collectionLog.uniqueItemsTotal,
    uniqueItemsObtained: pluginData.collectionLog.uniqueItemsObtained,
    tabs: Object.entries(pluginData.collectionLog.tabs).map(
      ([tabName, tab], orderIdx) => ({
        name: tabName,
        orderIdx,
        pages: Object.entries(tab).map(([entryName, entry]) => ({
          name: entryName,
          orderIdx: entry.index,
          killCounts: entry.killCounts?.map((kc) => ({
            label: kc.name,
            count: kc.count,
            orderIdx: kc.index,
          })),
          items: entry.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            orderIdx: item.index,
          })),
        })),
      })
    ),
  };

  return {
    ...account,
    skills,
    questList,
    achievementDiaries,
    combatAchievements,
    hiscores,
    collectionLog,
  };
}

export type PluginData = ReturnType<typeof getFormattedPluginData>;
