import {
  index,
  int,
  mysqlTable,
  primaryKey,
  varchar,
} from "drizzle-orm/mysql-core";

export const clogTabs = mysqlTable("collection_log_tabs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  orderIdx: int("order_idx").notNull(),
});

export const clogPages = mysqlTable(
  "collection_log_pages",
  {
    id: int("id").autoincrement().primaryKey(),
    tabId: int("tab_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    orderIdx: int("order_idx").notNull(),
  },
  (table) => ({
    tabIdIdx: index("tab_id_idx").on(table.tabId),
  })
);

export const clogPageItems = mysqlTable(
  "collection_log_page_items",
  {
    pageId: int("page_id").notNull(),
    itemId: int("item_id").notNull(),
    itemOrderIdx: int("item_order_idx").notNull(),
  },
  (table) => {
    return {
      pageIdItemIdPk: primaryKey(table.pageId, table.itemId),
      pageIdIdx: index("page_id_idx").on(table.pageId),
      itemIdIdx: index("item_id_idx").on(table.itemId),
    };
  }
);

export const clogItems = mysqlTable("collection_log_items", {
  id: int("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const clogPageKcs = mysqlTable(
  "collection_log_page_kcs",
  {
    id: int("id").autoincrement().primaryKey(),
    pageId: int("page_id").notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    orderIdx: int("order_idx").notNull(),
  },
  (table) => {
    return {
      pageIdIdx: index("page_id_idx").on(table.pageId),
    };
  }
);
