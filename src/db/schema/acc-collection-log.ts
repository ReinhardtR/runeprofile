import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { accounts } from "~/db/schema/account";
import { clogItems, clogKcs } from "~/db/schema/collection-log";

export const accClogItems = sqliteTable(
  "acc_clog_items",
  {
    accountHash: text("account_hash", {
      length: 40,
    })
      .notNull()
      .references(() => accounts.accountHash),
    itemId: integer("item_id")
      .notNull()
      .references(() => clogItems.id),
    quantity: integer("quantity").notNull(),
    obtainedAt: integer("obtained_at", { mode: "timestamp" }),
  },
  (table) => ({
    accountHashItemIdPk: primaryKey({
      columns: [table.accountHash, table.itemId],
    }),
  })
);

export const accClogItemsRelations = relations(accClogItems, ({ one }) => ({
  account: one(accounts, {
    fields: [accClogItems.accountHash],
    references: [accounts.accountHash],
  }),
  item: one(clogItems, {
    fields: [accClogItems.itemId],
    references: [clogItems.id],
  }),
}));

export const accClogKcs = sqliteTable(
  "acc_clog_kcs",
  {
    accountHash: text("account_hash", {
      length: 40,
    })
      .notNull()
      .references(() => accounts.accountHash),
    kcId: integer("kc_id")
      .notNull()
      .references(() => clogKcs.id),
    count: integer("count").notNull(),
  },
  (table) => ({
    accountHashPageIdKcIdPk: primaryKey({
      columns: [table.accountHash, table.kcId],
    }),
  })
);

export const accClogKcsRelations = relations(accClogKcs, ({ one }) => ({
  account: one(accounts, {
    fields: [accClogKcs.accountHash],
    references: [accounts.accountHash],
  }),
  kc: one(clogKcs, {
    fields: [accClogKcs.kcId],
    references: [clogKcs.id],
  }),
}));

export const accClogItemObtainedKcs = sqliteTable(
  "acc_clog_item_obtained_kcs",
  {
    accountHash: text("account_hash", {
      length: 40,
    })
      .notNull()
      .references(() => accounts.accountHash),
    itemId: integer("item_id")
      .notNull()
      .references(() => clogItems.id),
    kcId: integer("kc_id")
      .notNull()
      .references(() => clogKcs.id),
    count: integer("count").notNull(),
  },
  (table) => ({
    accountHashItemIdKcIdPk: primaryKey({
      columns: [table.accountHash, table.itemId, table.kcId],
    }),
  })
);

export const accClogItemObtainedKcsRelations = relations(
  accClogItemObtainedKcs,
  ({ one }) => ({
    account: one(accounts, {
      fields: [accClogItemObtainedKcs.accountHash],
      references: [accounts.accountHash],
    }),
    item: one(clogItems, {
      fields: [accClogItemObtainedKcs.itemId],
      references: [clogItems.id],
    }),
    kc: one(clogKcs, {
      fields: [accClogItemObtainedKcs.kcId],
      references: [clogKcs.id],
    }),
  })
);
