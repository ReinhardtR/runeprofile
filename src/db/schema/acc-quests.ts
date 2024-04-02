import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { accounts } from "~/db/schema/account";
import { quests } from "~/db/schema/quests";

const QUEST_STATE = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  FINISHED: "finished",
} as const;
export type QuestStateEnum = keyof typeof QUEST_STATE;

export const accQuests = sqliteTable(
  "acc_quests",
  {
    accountHash: text("account_hash", {
      length: 40,
    })
      .notNull()
      .references(() => accounts.accountHash),
    questId: integer("quest_id")
      .notNull()
      .references(() => quests.id),
    state: text("state", {
      enum: Object.values(QUEST_STATE) as [string, ...string[]],
    }).notNull(),
  },
  (table) => ({
    accountHashQuestIdPk: primaryKey({
      columns: [table.accountHash, table.questId],
    }),
  })
);

export const accQuestsRelations = relations(accQuests, ({ one }) => ({
  account: one(accounts, {
    fields: [accQuests.accountHash],
    references: [accounts.accountHash],
  }),
  quest: one(quests, {
    fields: [accQuests.questId],
    references: [quests.id],
  }),
}));
