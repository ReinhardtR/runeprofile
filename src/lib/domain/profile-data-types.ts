import { QuestState, QuestType } from "~/lib/constants/quests";

// omit skills and questList
export type Account = Omit<
  ProfileFull,
  | "skills"
  | "questList"
  | "collectionLog"
  | "achievementDiaries"
  | "combatAchievements"
  | "hiscores"
>;

export type ProfileFull = Omit<ProfileFullWithHash, "accountHash">;

export type ProfileFullWithHash = {
  accountHash: string;
  username: string;
  accountType: AccountType;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  modelUri: string | null;
  skills: Skill[];
  questList: QuestList;
  achievementDiaries: AchievementDiaries;
  combatAchievements: CombatAchievements;
  collectionLog: CollectionLog;
  hiscores: Hiscores;
};

// Account
export const AccountType = {
  NORMAL: "NORMAL",
  IRONMAN: "IRONMAN",
  HARDCORE_IRONMAN: "HARDCORE_IRONMAN",
  ULTIMATE_IRONMAN: "ULTIMATE_IRONMAN",
  GROUP_IRONMAN: "GROUP_IRONMAN",
  HARDCORE_GROUP_IRONMAN: "HARDCORE_GROUP_IRONMAN",
  UNRANKED_GROUP_IRONMAN: "UNRANKED_GROUP_IRONMAN",
} as const;
export type AccountType = keyof typeof AccountType;

// Skills
export type Skill = {
  name: string;
  xp: number;
  orderIdx: number;
};

//  Quests
export type Quest = {
  name: string;
  state: QuestState;
  type: QuestType;
  orderIdx: number;
};

export type QuestList = {
  points: number;
  quests: Quest[];
};

// Achievement Diaries
export const AchievementDiaryTierName = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
  ELITE: "ELITE",
} as const;
export const AchievementDiaryTierNames = Object.keys(
  AchievementDiaryTierName
) as AchievementDiaryTierName[];
export type AchievementDiaryTierName = keyof typeof AchievementDiaryTierName;

export type AchievementDiaryTier = {
  name: AchievementDiaryTierName;
  tasksTotal: number;
  tasksCompleted: number;
};

export type AchievementDiaryArea = {
  area: string;
  tiers: AchievementDiaryTier[];
};

export type AchievementDiaries = AchievementDiaryArea[];

// Combat Achievements
export const CombatAchievementsTierName = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
  ELITE: "ELITE",
  MASTER: "MASTER",
  GRANDMASTER: "GRANDMASTER",
} as const;
export const CombatAchievementsTierNames = Object.keys(
  CombatAchievementsTierName
) as CombatAchievementsTierName[];
export type CombatAchievementsTierName =
  keyof typeof CombatAchievementsTierName;

export type CombatAchievementsTier = {
  tier: CombatAchievementsTierName;
  tasksTotal: number;
  tasksCompleted: number;
};

export type CombatAchievements = CombatAchievementsTier[];

// Collection Log
export type CollectionLog = {
  uniqueItemsTotal: number;
  uniqueItemsObtained: number;
  tabs: CollectionLogTab[];
  items: CollectionLogItem[];
};

export type CollectionLogTab = {
  name: string;
  orderIdx: number;
  pages: CollectionLogPage[];
};

export type CollectionLogPage = {
  name: string;
  orderIdx: number;
  killCounts: CollectionLogKillCount[];
  itemIds: number[];
};

export type CollectionLogKillCount = {
  label: string;
  count: number;
  orderIdx: number;
};

export type CollectionLogItem = {
  id: number;
  name: string;
  quantity: number;
  obtainedAt?: CollectionLogItemObtainedAt;
};

export type CollectionLogItemObtainedAt = {
  timestamp: Date;
  killCounts: CollectionLogKillCount[];
};

// Hiscores
export const HiscoresGameMode = {
  NORMAL: "NORMAL",
  IRONMAN: "IRONMAN",
  HARDCORE: "HARDCORE",
  ULTIMATE: "ULTIMATE",
} as const;
export type HiscoresGameMode = keyof typeof HiscoresGameMode;

export type HiscoresEntry = {
  activity: string;
  score: number;
  rank: number;
  orderIdx: number;
};

export type HiscoresLeaderboard = {
  gameMode: HiscoresGameMode;
  entries: HiscoresEntry[];
};

export type Hiscores = HiscoresLeaderboard[];
