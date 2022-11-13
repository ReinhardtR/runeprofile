import { QuestType, QuestState, AccountType } from "@prisma/client";
import { z } from "zod";
import { QUEST_TYPE_MAP, RFD_QUESTS } from "./quests";

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

export enum TabsOrder {
  Bosses = "Bosses",
  Raids = "Raids",
  Clues = "Clues",
  Minigames = "Minigames",
  Other = "Other",
}

const CollectionLogSchema = z.object({
  uniqueItemsObtained: z.number(),
  uniqueItemsTotal: z.number(),
  tabs: z.record(CollectionLogTabSchema),
});

export type CollectionLogSchemaType = z.infer<typeof CollectionLogSchema>;

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

const HiscoresActivitiesSchema = z.array(
  z.object({
    index: z.number(),
    name: z.string(),
    rank: z.number(),
    score: z.number(),
  })
);

const HiscoresBossesSchema = z.array(
  z.object({
    index: z.number(),
    name: z.string(),
    rank: z.number(),
    kills: z.number(),
  })
);

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
