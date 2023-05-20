// The types for the profile-data after it has been processed to be used by the app.

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

export type Account = {
  username: string;
  accountType: AccountType;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  combatLevel: number;
  modelUri: string | null;
};

export type FullAccount = {
  username: string;
  accountType: AccountType;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  combatLevel: number;
  modelUri: string | null;
  skills: Skills;
  questList: QuestList;
  collectionLog: CollectionLog;
  achievementDiaries: AchievementDiaries;
  combatAchievements: CombatAchievements;
  hiscores: Hiscores;
};

export type FullAccountWithAccountHash = FullAccount & {
  accountHash: string;
};

// Skills
export type Skill = {
  index: number;
  name: string;
  xp: number;
};

export type Skills = Skill[];

//  Quests
export const QuestState = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  FINISHED: "FINISHED",
} as const;
export type QuestState = keyof typeof QuestState;

export const QuestType = {
  F2P: "F2P",
  P2P: "P2P",
  MINI: "MINI",
  UNKNOWN: "UNKNOWN",
} as const;
export type QuestType = keyof typeof QuestType;

export type Quest = {
  index: number;
  name: string;
  state: QuestState;
  type: QuestType;
};

export type QuestList = {
  quests: Quest[];
  points: number;
};

// Achievement Diaries
export const AchievementDiaryTierName = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
  ELITE: "ELITE",
} as const;
export type AchievementDiaryTierName = keyof typeof AchievementDiaryTierName;

export type AchievementDiaryTier = {
  tier: AchievementDiaryTierName;
  completed: number;
  total: number;
};

export type AchievementDiary = {
  area: string;
  tiers: AchievementDiaryTier[];
};

export type AchievementDiaries = AchievementDiary[];

// Combat Achievements
export const CombatAchievementTierName = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
  ELITE: "ELITE",
  MASTER: "MASTER",
  GRANDMASTER: "GRANDMASTER",
} as const;
export type CombatAchievementTierName = keyof typeof CombatAchievementTierName;

export type CombatAchievementTier = {
  tier: CombatAchievementTierName;
  completed: number;
  total: number;
};

export type CombatAchievements = CombatAchievementTier[];

// Collection Log
export type KillCount = {
  index: number;
  name: string;
  count: number;
};

export type CollectionLogEntry = {
  index: number;
  name: string;
  isCompleted: boolean;
  killCounts: KillCount[];
  items: ItemType[];
};

export type CollectionLogTab = {
  name: string;
  entries: CollectionLogEntry[];
};

export type CollectionLog = {
  tabs: CollectionLogTab[];
  uniqueItemsObtained: number;
  uniqueItemsTotal: number;
};

export type CollectionlogEntryWithoutItems = Omit<CollectionLogEntry, "items">;

export type CollectionLogTabWithoutItems = Omit<CollectionLogTab, "entries"> & {
  entries: CollectionlogEntryWithoutItems[];
};

export type CollectionLogWithoutItems = Omit<CollectionLog, "tabs"> & {
  tabs: CollectionLogTabWithoutItems[];
};

// Collection Log Items
export type ItemType = {
  id: number;
  index: number;
  name: string;
  quantity: number;
  obtainedAt?: ObtainedAtType;
};

export type ObtainedAtType = {
  date: Date;
  killCounts: KillCount[];
};

// Hiscores
export const LeaderboardType = {
  NORMAL: "NORMAL",
  IRONMAN: "IRONMAN",
  HARDCORE: "HARDCORE",
  ULTIMATE: "ULTIMATE",
} as const;
export type LeaderboardType = keyof typeof LeaderboardType;

export const HiscoresAccountType = {
  NORMAL: "NORMAL",
  IRONMAN: "IRONMAN",
  HARDCORE: "HARDCORE",
  ULTIMATE: "ULTIMATE",
};
export type HiscoresAccountType = keyof typeof HiscoresAccountType;

export type HiscoresSkill = {
  index: number;
  name: string;
  rank: number;
  level: number;
  xp: number;
};

export type HiscoresActivity = {
  index: number;
  name: string;
  rank: number;
  score: number;
};

export type HiscoresBoss = {
  index: number;
  name: string;
  rank: number;
  kills: number;
};

export type HiscoresLeaderboard = {
  type: HiscoresAccountType;
  skills: HiscoresSkill[];
  activities: HiscoresActivity[];
  bosses: HiscoresBoss[];
};

export type Hiscores = HiscoresLeaderboard[];
