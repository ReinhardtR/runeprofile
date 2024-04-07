import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const clogPages = sqliteTable("clog_pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tab: text("tab", { length: 255 }).notNull(),
  name: text("name", { length: 255 }).unique().notNull(),
  orderIdx: integer("order_idx").notNull(),
  metaApproved: integer("meta_approved", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const clogPagesRelations = relations(clogPages, ({ many }) => ({
  pageItems: many(clogPagesItems),
  pageKcs: many(clogPagesKcs),
}));

export const clogPagesItems = sqliteTable(
  "clog_pages_items",
  {
    pageId: integer("page_id")
      .notNull()
      .references(() => clogPages.id),
    itemId: integer("item_id")
      .notNull()
      .references(() => clogItems.id),
    orderIdx: integer("order_idx").notNull(),
    metaApproved: integer("meta_approved", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => {
    return {
      pageIdItemIdPk: primaryKey({
        columns: [table.pageId, table.itemId],
      }),
    };
  }
);

export const clogPagesItemsRelations = relations(clogPagesItems, ({ one }) => ({
  page: one(clogPages, {
    fields: [clogPagesItems.pageId],
    references: [clogPages.id],
  }),
  item: one(clogItems, {
    fields: [clogPagesItems.itemId],
    references: [clogItems.id],
  }),
}));

export const clogItems = sqliteTable("clog_items", {
  id: integer("id").primaryKey(),
  name: text("name", { length: 255 }).notNull(),
  metaApproved: integer("meta_approved", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const clogItemsRelations = relations(clogItems, ({ many }) => ({
  itemPages: many(clogPagesItems),
}));

export const clogPagesKcs = sqliteTable(
  "clog_pages_kcs",
  {
    pageId: integer("page_id")
      .notNull()
      .references(() => clogPages.id),
    kcId: integer("kc_id")
      .notNull()
      .references(() => clogKcs.id),
    orderIdx: integer("order_idx").notNull(),
    metaApproved: integer("meta_approved", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => {
    return {
      pageIdKcIdPk: primaryKey({
        columns: [table.pageId, table.kcId],
      }),
    };
  }
);

export const clogPagesKcsRelations = relations(clogPagesKcs, ({ one }) => ({
  page: one(clogPages, {
    fields: [clogPagesKcs.pageId],
    references: [clogPages.id],
  }),
  kc: one(clogKcs, {
    fields: [clogPagesKcs.kcId],
    references: [clogKcs.id],
  }),
}));

export const clogKcs = sqliteTable("clog_kcs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label", { length: 255 }).unique().notNull(),
  metaApproved: integer("meta_approved", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const clogKcsRelations = relations(clogKcs, ({ many }) => ({
  kcPages: many(clogPagesKcs),
}));
