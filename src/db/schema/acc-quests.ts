import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { accountHashColumn } from "~/db/schema/account";

export const questStateEnum = mysqlEnum("quest_state", [
  "not_started",
  "in_progress",
  "finished",
]);

export const accQuests = mysqlTable(
  "acc_quests",
  {
    accountHash: accountHashColumn,
    questId: int("quest_id").notNull(),
    state: questStateEnum.notNull(),
  },
  (table) => ({
    accountHashQuestIdPk: primaryKey(table.accountHash, table.questId),
    accountHashIdx: index("account_hash_idx").on(table.accountHash),
    questIdIdx: index("quest_id_idx").on(table.questId),
  })
);
