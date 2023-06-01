import {
  mysqlTable,
  uniqueIndex,
  varchar,
  mysqlEnum,
  tinyint,
  int,
  datetime,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import {
  achievementDiary,
  collectionLog,
  combatAchievements,
  hiscoresLeaderboard,
  questList,
  skill,
} from "~/db/schema";

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

export const accountRelations = relations(account, ({ one, many }) => ({
  achievementDiaries: many(achievementDiary),
  collectionLog: one(collectionLog, {
    fields: [account.accountHash],
    references: [collectionLog.accountHash],
  }),
  combatAchievements: one(combatAchievements, {
    fields: [account.accountHash],
    references: [combatAchievements.accountHash],
  }),
  hiscores: many(hiscoresLeaderboard),
  questList: one(questList, {
    fields: [account.accountHash],
    references: [questList.accountHash],
  }),
  skills: many(skill),
}));
