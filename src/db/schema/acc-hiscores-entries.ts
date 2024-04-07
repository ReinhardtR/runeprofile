import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { accounts } from "~/db/schema/account";
import { hiscoresEntries } from "~/db/schema/hiscores-entries";

export const accHiscoresEntries = sqliteTable(
  "acc_hiscores_entries",
  {
    accountHash: text("account_hash", {
      length: 40,
    })
      .notNull()
      .references(() => accounts.accountHash, { onDelete: "cascade" }),
    entryId: integer("entry_id")
      .notNull()
      .references(() => hiscoresEntries.id),
    rank: integer("rank").notNull(),
    score: integer("score").notNull(),
  },
  (table) => ({
    accountHashHiscoresIdPk: primaryKey({
      columns: [table.accountHash, table.entryId],
    }),
  })
);

export const accHiscoresEntriesRelations = relations(
  accHiscoresEntries,
  ({ one }) => ({
    account: one(accounts, {
      fields: [accHiscoresEntries.accountHash],
      references: [accounts.accountHash],
    }),
    hiscore: one(hiscoresEntries, {
      fields: [accHiscoresEntries.entryId],
      references: [hiscoresEntries.id],
    }),
  })
);
