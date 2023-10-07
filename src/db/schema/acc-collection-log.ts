import {
  index,
  int,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { accountHashColumn } from "~/db/schema/account";

export const accClogItems = mysqlTable(
  "acc_collection_log_items",
  {
    accountHash: accountHashColumn,
    itemId: int("item_id").notNull(),
    quantity: int("quantity").notNull(),
    obtainedAt: timestamp("obtained_at"),
  },
  (table) => ({
    accountHashItemIdPk: primaryKey(table.accountHash, table.itemId),
    accountHashIdx: index("account_hash_idx").on(table.accountHash),
    itemIdIdx: index("item_id_idx").on(table.itemId),
  })
);

export const accClogPageKcs = mysqlTable(
  "acc_collection_log_page_kcs",
  {
    accountHash: accountHashColumn,
    pageId: int("page_id").notNull(),
    kcId: int("kc_id").notNull(),
    count: int("count").notNull(),
  },
  (table) => ({
    accountHashPageIdKcIdPk: primaryKey(
      table.accountHash,
      table.pageId,
      table.kcId
    ),
    accountHashIdx: index("account_hash_idx").on(table.accountHash),
    pageIdIdx: index("page_id_idx").on(table.pageId),
    kcIdIdx: index("kc_id_idx").on(table.kcId),
  })
);

export const accClogItemObtainedKcs = mysqlTable(
  "acc_collection_log_item_obtained_kcs",
  {
    accountHash: accountHashColumn,
    itemId: int("item_id").notNull(),
    kcId: int("kc_id").notNull(),
    count: int("count").notNull(),
  },
  (table) => ({
    accountHashItemIdKcIdPk: primaryKey(
      table.accountHash,
      table.itemId,
      table.kcId
    ),
    accountHashIdx: index("account_hash_idx").on(table.accountHash),
    itemIdIdx: index("item_id_idx").on(table.itemId),
    kcIdIdx: index("kc_id_idx").on(table.kcId),
  })
);
