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
import { relations, sql } from "drizzle-orm";
import { account } from "~/db/schema";

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

export const hiscoresLeaderboardRelations = relations(
  hiscoresLeaderboard,
  ({ one, many }) => ({
    account: one(account, {
      fields: [hiscoresLeaderboard.accountHash],
      references: [account.accountHash],
    }),
    activites: many(hiscoresActivity),
    bosses: many(hiscoresBoss),
    skills: many(hiscoresSkill),
  })
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

export const hiscoresActivityRelations = relations(
  hiscoresActivity,
  ({ one }) => ({
    leaderboard: one(hiscoresLeaderboard, {
      fields: [hiscoresActivity.accountHash, hiscoresActivity.leaderboardType],
      references: [hiscoresLeaderboard.accountHash, hiscoresLeaderboard.type],
    }),
  })
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

export const hiscoresBossRelations = relations(hiscoresBoss, ({ one }) => ({
  leaderboard: one(hiscoresLeaderboard, {
    fields: [hiscoresBoss.accountHash, hiscoresBoss.leaderboardType],
    references: [hiscoresLeaderboard.accountHash, hiscoresLeaderboard.type],
  }),
}));

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

export const hiscoresSkillRelations = relations(hiscoresSkill, ({ one }) => ({
  leaderboard: one(hiscoresLeaderboard, {
    fields: [hiscoresSkill.accountHash, hiscoresSkill.leaderboardType],
    references: [hiscoresLeaderboard.accountHash, hiscoresLeaderboard.type],
  }),
}));
