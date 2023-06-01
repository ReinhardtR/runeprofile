import {
  mysqlTable,
  varchar,
  int,
  datetime,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { account } from "~/db/schema";

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

export const skillRelations = relations(skill, ({ one }) => ({
  account: one(account, {
    fields: [skill.accountHash],
    references: [account.accountHash],
  }),
}));
