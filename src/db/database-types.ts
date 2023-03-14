import {
  Generated,
  ColumnType,
} from 'kysely'

export type AccountType = "NORMAL" | "IRONMAN" | "HARDCORE_IRONMAN" | "ULTIMATE_IRONMAN" | "GROUP_IRONMAN" | "HARDCORE_GROUP_IRONMAN" | "UNRANKED_GROUP_IRONMAN";export type AchievementDiaryTierName = "EASY" | "MEDIUM" | "HARD" | "ELITE";export type CombatAchievementTierName = "EASY" | "MEDIUM" | "HARD" | "ELITE" | "MASTER" | "GRANDMASTER";export type QuestType = "F2P" | "P2P" | "MINI" | "UNKNOWN";export type QuestState = "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";export type LeaderboardType = "NORMAL" | "IRONMAN" | "HARDCORE" | "ULTIMATE";

export type Account = {
  accountHash: string;
  username: string;
  accountType: AccountType;
  isPrivate: boolean;
  generatedPath: string | null;
  modelUri: string | null;
  description: string;
  combatLevel: number;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type Skill = {
  index: number;
  name: string;
  xp: number;
  accountHash: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type AchievementDiary = {
  area: string;
  accountHash: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type AchievementDiaryTier = {
  tier: AchievementDiaryTierName;
  completed: number;
  total: number;
  accountHash: string;
  area: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type CombatAchievements = {
  accountHash: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>
}

export type CombatAchievementTier = {
  tier: CombatAchievementTierName;
  completed: number;
  total: number;
  accountHash: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type QuestList = {
  points: number;
  accountHash: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type Quest = {
  index: number;
  name: string;
  state: QuestState;
  type: QuestType;
  accountHash: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type HiscoresLeaderboard = {
  type: LeaderboardType;
  accountHash: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>
}

export type HiscoresSkill = {
  index: number;
  name: string;
  rank: number;
  level: number;
  xp: number;
  accountHash: string;
  leaderboardType: LeaderboardType;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type HiscoresActivity = {
  index: number;
  name: string;
  rank: number;
  score: number;
  accountHash: string;
  leaderboardType: LeaderboardType;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type HiscoresBoss = {
  index: number;
  name: string;
  rank: number;
  kills: number;
  accountHash: string;
  leaderboardType: LeaderboardType;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type CollectionLog = {
  uniqueItemsObtained: number;
  uniqueItemsTotal: number;
  accountHash: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type Tab = {
  index: number;
  name: string;
  accountHash: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type Entry = {
  index: number;
  name: string;
  accountHash: string;
  tabName: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type KillCount = {
  index: number;
  name: string;
  count: number;
  accountHash: string;
  tabName: string;
  entryName: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type Item = {
  index: number;
  id: number;
  name: string;
  quantity: number;
  accountHash: string;
  tabName: string;
  entryName: string;
  createdAt: ColumnType<Date | null, Date | string, Date | string>;
  updatedAt: ColumnType<Date, Date | string, Date | string>
}

export type ObtainedAt = {
  date: ColumnType<Date | null, Date | string, Date | string>;
  accountHash: string;
  tabName: string;
  entryName: string;
  itemId: number;
  createdAt: ColumnType<Date | null, Date | string, Date | string>
}

export type ObtainedAtKillCount = {
  index: number;
  name: string;
  count: number;
  accountHash: string;
  tabName: string;
  entryName: string;
  itemId: number;
  createdAt: ColumnType<Date | null, Date | string, Date | string>
}

export type Database = {
  Account: Account;
  Skill: Skill;
  AchievementDiary: AchievementDiary;
  AchievementDiaryTier: AchievementDiaryTier;
  CombatAchievements: CombatAchievements;
  CombatAchievementTier: CombatAchievementTier;
  QuestList: QuestList;
  Quest: Quest;
  HiscoresLeaderboard: HiscoresLeaderboard;
  HiscoresSkill: HiscoresSkill;
  HiscoresActivity: HiscoresActivity;
  HiscoresBoss: HiscoresBoss;
  CollectionLog: CollectionLog;
  Tab: Tab;
  Entry: Entry;
  KillCount: KillCount;
  Item: Item;
  ObtainedAt: ObtainedAt;
  ObtainedAtKillCount: ObtainedAtKillCount;
}