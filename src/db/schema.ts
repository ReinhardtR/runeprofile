import {
  mysqlTable,
  uniqueIndex,
  varchar,
  mysqlEnum,
  tinyint,
  int,
  datetime,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const account = mysqlTable(
  "Account",
  {
    accountHash: varchar("accountHash", { length: 40 }).primaryKey().notNull(),
    username: varchar("username", { length: 12 }).notNull(),
    accountType: mysqlEnum("accountType", [
      "normal",
      "ironman",
      "hardcore_ironman",
      "ultimate_ironman",
      "group_ironman",
      "hardcore_group_ironman",
      "unranked_group_ironman",
    ]).notNull(),
    isPrivate: tinyint("isPrivate").default(0).notNull(),
    generatedPath: varchar("generatedPath", { length: 16 }),
    modelUri: varchar("modelUri", { length: 191 }),
    description: varchar("description", { length: 191 }).default("").notNull(),
    combatLevel: int("combatLevel").notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      usernameKey: uniqueIndex("Account_username_key").on(table.username),
      generatedPathKey: uniqueIndex("Account_generatedPath_key").on(
        table.generatedPath
      ),
    };
  }
);

export const achievementDiary = mysqlTable(
  "AchievementDiary",
  {
    area: varchar("area", { length: 191 }).notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("AchievementDiary_accountHash_idx").on(
        table.accountHash
      ),
      achievementDiaryAccountHashArea: primaryKey(
        table.accountHash,
        table.area
      ),
    };
  }
);

export const achievementDiaryTier = mysqlTable(
  "AchievementDiaryTier",
  {
    tier: mysqlEnum("tier", ["easy", "medium", "hard", "elite"]).notNull(),
    completed: int("completed").notNull(),
    total: int("total").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    area: varchar("area", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashAreaIdx: index("AchievementDiaryTier_accountHash_area_idx").on(
        table.accountHash,
        table.area
      ),
      achievementDiaryTierAccountHashAreaTier: primaryKey(
        table.accountHash,
        table.area,
        table.tier
      ),
    };
  }
);

export const collectionLog = mysqlTable(
  "CollectionLog",
  {
    uniqueItemsObtained: int("uniqueItemsObtained").notNull(),
    uniqueItemsTotal: int("uniqueItemsTotal").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).primaryKey().notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("CollectionLog_accountHash_idx").on(
        table.accountHash
      ),
    };
  }
);

export const combatAchievementTier = mysqlTable(
  "CombatAchievementTier",
  {
    tier: mysqlEnum("tier", [
      "easy",
      "medium",
      "hard",
      "elite",
      "master",
      "grandmaster",
    ]).notNull(),
    completed: int("completed").notNull(),
    total: int("total").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("CombatAchievementTier_accountHash_idx").on(
        table.accountHash
      ),
      combatAchievementTierAccountHashTier: primaryKey(
        table.accountHash,
        table.tier
      ),
    };
  }
);

export const combatAchievements = mysqlTable(
  "CombatAchievements",
  {
    accountHash: varchar("accountHash", { length: 191 }).primaryKey().notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("CombatAchievements_accountHash_idx").on(
        table.accountHash
      ),
    };
  }
);

export const entry = mysqlTable(
  "Entry",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    tabName: varchar("tabName", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashTabNameIdx: index("Entry_accountHash_tabName_idx").on(
        table.accountHash,
        table.tabName
      ),
      entryAccountHashNameTabName: primaryKey(
        table.accountHash,
        table.name,
        table.tabName
      ),
    };
  }
);

export const hiscoresActivity = mysqlTable(
  "HiscoresActivity",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    rank: int("rank").notNull(),
    score: int("score").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    leaderboardType: mysqlEnum("leaderboardType", [
      "normal",
      "ironman",
      "hardcore",
      "ultimate",
    ]).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashLeaderboardTypeIdx: index(
        "HiscoresActivity_accountHash_leaderboardType_idx"
      ).on(table.accountHash, table.leaderboardType),
      hiscoresActivityAccountHashLeaderboardTypeName: primaryKey(
        table.accountHash,
        table.leaderboardType,
        table.name
      ),
    };
  }
);

export const hiscoresBoss = mysqlTable(
  "HiscoresBoss",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    rank: int("rank").notNull(),
    kills: int("kills").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    leaderboardType: mysqlEnum("leaderboardType", [
      "normal",
      "ironman",
      "hardcore",
      "ultimate",
    ]).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashLeaderboardTypeIdx: index(
        "HiscoresBoss_accountHash_leaderboardType_idx"
      ).on(table.accountHash, table.leaderboardType),
      hiscoresBossAccountHashLeaderboardTypeName: primaryKey(
        table.accountHash,
        table.leaderboardType,
        table.name
      ),
    };
  }
);

export const hiscoresLeaderboard = mysqlTable(
  "HiscoresLeaderboard",
  {
    type: mysqlEnum("type", [
      "normal",
      "ironman",
      "hardcore",
      "ultimate",
    ]).notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("HiscoresLeaderboard_accountHash_idx").on(
        table.accountHash
      ),
      hiscoresLeaderboardAccountHashType: primaryKey(
        table.accountHash,
        table.type
      ),
    };
  }
);

export const hiscoresSkill = mysqlTable(
  "HiscoresSkill",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    rank: int("rank").notNull(),
    level: int("level").notNull(),
    xp: int("xp").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    leaderboardType: mysqlEnum("leaderboardType", [
      "normal",
      "ironman",
      "hardcore",
      "ultimate",
    ]).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashLeaderboardTypeIdx: index(
        "HiscoresSkill_accountHash_leaderboardType_idx"
      ).on(table.accountHash, table.leaderboardType),
      hiscoresSkillAccountHashLeaderboardTypeName: primaryKey(
        table.accountHash,
        table.leaderboardType,
        table.name
      ),
    };
  }
);

export const item = mysqlTable(
  "Item",
  {
    index: int("index").notNull(),
    id: int("id").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    quantity: int("quantity").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    tabName: varchar("tabName", { length: 191 }).notNull(),
    entryName: varchar("entryName", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashTabNameEntryNameIdx: index(
        "Item_accountHash_tabName_entryName_idx"
      ).on(table.accountHash, table.tabName, table.entryName),
      itemAccountHashEntryNameIdTabName: primaryKey(
        table.accountHash,
        table.entryName,
        table.id,
        table.tabName
      ),
    };
  }
);

export const killCount = mysqlTable(
  "KillCount",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    count: int("count").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    tabName: varchar("tabName", { length: 191 }).notNull(),
    entryName: varchar("entryName", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashTabNameEntryNameIdx: index(
        "KillCount_accountHash_tabName_entryName_idx"
      ).on(table.accountHash, table.tabName, table.entryName),
      killCountAccountHashEntryNameNameTabName: primaryKey(
        table.accountHash,
        table.entryName,
        table.name,
        table.tabName
      ),
    };
  }
);

export const obtainedAt = mysqlTable(
  "ObtainedAt",
  {
    date: datetime("date", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    tabName: varchar("tabName", { length: 191 }).notNull(),
    entryName: varchar("entryName", { length: 191 }).notNull(),
    itemId: int("itemId").notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
  },
  (table) => {
    return {
      accountHashTabNameEntryNameItemIdIdx: index(
        "ObtainedAt_accountHash_tabName_entryName_itemId_idx"
      ).on(table.accountHash, table.tabName, table.entryName, table.itemId),
      obtainedAtAccountHashEntryNameItemIdTabName: primaryKey(
        table.accountHash,
        table.entryName,
        table.itemId,
        table.tabName
      ),
    };
  }
);

export const obtainedAtKillCount = mysqlTable(
  "ObtainedAtKillCount",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    count: int("count").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    tabName: varchar("tabName", { length: 191 }).notNull(),
    entryName: varchar("entryName", { length: 191 }).notNull(),
    itemId: int("itemId").notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
  },
  (table) => {
    return {
      accountHashTabNameEntryNameItemIdIdx: index(
        "ObtainedAtKillCount_accountHash_tabName_entryName_itemId_idx"
      ).on(table.accountHash, table.tabName, table.entryName, table.itemId),
      obtainedAtKillCountAccountHashEntryNameItemIdNameTabName: primaryKey(
        table.accountHash,
        table.entryName,
        table.itemId,
        table.name,
        table.tabName
      ),
    };
  }
);

export const quest = mysqlTable(
  "Quest",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    state: mysqlEnum("state", [
      "not_started",
      "in_progress",
      "finished",
    ]).notNull(),
    type: mysqlEnum("type", ["f2p", "p2p", "mini", "unknown"]).notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("Quest_accountHash_idx").on(table.accountHash),
      questAccountHashName: primaryKey(table.accountHash, table.name),
    };
  }
);

export const questList = mysqlTable(
  "QuestList",
  {
    points: int("points").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).primaryKey().notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("QuestList_accountHash_idx").on(table.accountHash),
    };
  }
);

export const skill = mysqlTable(
  "Skill",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    xp: int("xp").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("Skill_accountHash_idx").on(table.accountHash),
      skillAccountHashName: primaryKey(table.accountHash, table.name),
    };
  }
);

export const tab = mysqlTable(
  "Tab",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("Tab_accountHash_idx").on(table.accountHash),
      tabAccountHashName: primaryKey(table.accountHash, table.name),
    };
  }
);
