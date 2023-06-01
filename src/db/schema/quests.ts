import {
  mysqlTable,
  varchar,
  mysqlEnum,
  int,
  datetime,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

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

export const questListRelations = relations(questList, ({ many }) => ({
  quests: many(quest),
}));

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

export const questRelations = relations(quest, ({ one }) => ({
  questList: one(questList, {
    fields: [quest.accountHash],
    references: [questList.accountHash],
  }),
}));
