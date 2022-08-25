import { AccountType, LeaderboardType } from "@/edgeql";
import { z } from "zod";
import { QuestType, QUEST_TYPE_MAP, RFD_QUESTS } from "./quests";

const CollectionLogItemSchema = z.object({
  index: z.number(),
  id: z.number(),
  name: z.string(),
  quantity: z.number(),
});

const KillCountSchema = z.object({
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

const QuestStateSchema = z.enum(["NOT_STARTED", "IN_PROGRESS", "FINISHED"]);

const QuestSchema = z.object({
  name: z.string(),
  state: QuestStateSchema,
});

const QuestListSchema = z.object({
  points: z.number(),
  quests: z.array(QuestSchema).transform((quests) => {
    const questsMap = new Map<string, z.infer<typeof QuestStateSchema>>(
      quests.map((quest) => [quest.name, quest.state])
    );

    type QuestsArray = z.infer<typeof QuestSchema>[];
    const f2p: {
      name: string;
      state: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
    }[] = [];
    const p2p: {
      name: string;
      state: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
    }[] = [];
    const mini: {
      name: string;
      state: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
    }[] = [];
    const unknown: {
      name: string;
      state: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
    }[] = [];

    for (const [name, type] of Object.entries(QUEST_TYPE_MAP)) {
      const state = questsMap.get(name);

      if (!state) {
        continue;
      }

      switch (type) {
        case QuestType.F2P:
          f2p.push({ name, state });
          break;
        case QuestType.P2P:
          p2p.push({ name, state });
          break;
        case QuestType.MINI:
          mini.push({ name, state });
          break;
        default:
          throw new Error(`Unknown quest type: ${type}`);
      }

      questsMap.delete(name);
    }

    for (const [name, state] of questsMap) {
      const isRFDQuest = Object.hasOwn(RFD_QUESTS, name);

      if (isRFDQuest) {
        continue;
      }

      unknown.push({ name, state });
    }

    return {
      f2p: f2p,
      p2p: p2p,
      mini: mini,
      unknown: unknown,
    };
  }),
});

const SkillsSchema = z.array(z.object({ name: z.string(), xp: z.number() }));

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
    name: z.string(),
    rank: z.number(),
    level: z.number(),
    xp: z.number(),
  })
);

const HiscoresActivitiesSchema = z.array(
  z.object({
    name: z.string(),
    rank: z.number(),
    score: z.number(),
  })
);

const HiscoresBossesSchema = z.array(
  z.object({
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
  accountHash: z.number(),
  username: z.string(),
  accountType: z.nativeEnum(AccountType),
  model: z.string(),
  skills: SkillsSchema,
  questList: QuestListSchema,
  achievementDiaries: AchievementDiariesSchema,
  combatAchievements: CombatAchievementsSchema,
  hiscores: HiscoresSchema,
  collectionLog: CollectionLogSchema,
});
