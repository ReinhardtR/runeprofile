import {
  mysqlTable,
  varchar,
  int,
  datetime,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

export const collectionLog = mysqlTable(
  "CollectionLog",
  {
    uniqueItemsObtained: int("uniqueItemsObtained").notNull(),
    uniqueItemsTotal: int("uniqueItemsTotal").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).primaryKey().notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("CollectionLog_accountHash_idx").on(
        table.accountHash
      ),
    };
  }
);

export const collectionLogRelations = relations(collectionLog, ({ many }) => ({
  tabs: many(tab),
}));

export const tab = mysqlTable(
  "Tab",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("Tab_accountHash_idx").on(table.accountHash),
      tabAccountHashName: primaryKey(table.accountHash, table.name),
    };
  }
);

export const tabRelations = relations(tab, ({ one, many }) => ({
  collectionLog: one(collectionLog, {
    fields: [tab.accountHash],
    references: [collectionLog.accountHash],
  }),
  entries: many(entry),
}));

export const entry = mysqlTable(
  "Entry",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    tabName: varchar("tabName", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashTabNameIdx: index("Entry_accountHash_tabName_idx").on(
        table.accountHash,
        table.tabName
      ),
      entryAccountHashNameTabName: primaryKey(
        table.accountHash,
        table.name,
        table.tabName
      ),
    };
  }
);

export const entryRelations = relations(entry, ({ one, many }) => ({
  tab: one(tab, {
    fields: [entry.accountHash, entry.tabName],
    references: [tab.accountHash, tab.name],
  }),
  items: many(item),
  killCounts: many(killCount),
}));

export const item = mysqlTable(
  "Item",
  {
    index: int("index").notNull(),
    id: int("id").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    quantity: int("quantity").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    tabName: varchar("tabName", { length: 191 }).notNull(),
    entryName: varchar("entryName", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashTabNameEntryNameIdx: index(
        "Item_accountHash_tabName_entryName_idx"
      ).on(table.accountHash, table.tabName, table.entryName),
      itemAccountHashEntryNameIdTabName: primaryKey(
        table.accountHash,
        table.entryName,
        table.id,
        table.tabName
      ),
    };
  }
);

export const itemRelations = relations(item, ({ one }) => ({
  entry: one(entry, {
    fields: [item.accountHash, item.tabName, item.entryName],
    references: [entry.accountHash, entry.tabName, entry.name],
  }),
  obtainedAt: one(obtainedAt, {
    fields: [item.accountHash, item.tabName, item.entryName, item.id],
    references: [
      obtainedAt.accountHash,
      obtainedAt.tabName,
      obtainedAt.entryName,
      obtainedAt.itemId,
    ],
  }),
}));

export const killCount = mysqlTable(
  "KillCount",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    count: int("count").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    tabName: varchar("tabName", { length: 191 }).notNull(),
    entryName: varchar("entryName", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashTabNameEntryNameIdx: index(
        "KillCount_accountHash_tabName_entryName_idx"
      ).on(table.accountHash, table.tabName, table.entryName),
      killCountAccountHashEntryNameNameTabName: primaryKey(
        table.accountHash,
        table.entryName,
        table.name,
        table.tabName
      ),
    };
  }
);

export const killCountRelations = relations(killCount, ({ one }) => ({
  entry: one(entry, {
    fields: [killCount.accountHash, killCount.tabName, killCount.entryName],
    references: [entry.accountHash, entry.tabName, entry.name],
  }),
}));

export const obtainedAt = mysqlTable(
  "ObtainedAt",
  {
    date: datetime("date", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    tabName: varchar("tabName", { length: 191 }).notNull(),
    entryName: varchar("entryName", { length: 191 }).notNull(),
    itemId: int("itemId").notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
  },
  (table) => {
    return {
      accountHashTabNameEntryNameItemIdIdx: index(
        "ObtainedAt_accountHash_tabName_entryName_itemId_idx"
      ).on(table.accountHash, table.tabName, table.entryName, table.itemId),
      obtainedAtAccountHashEntryNameItemIdTabName: primaryKey(
        table.accountHash,
        table.entryName,
        table.itemId,
        table.tabName
      ),
    };
  }
);

export const obtainedAtRelations = relations(obtainedAt, ({ one, many }) => ({
  item: one(item, {
    fields: [
      obtainedAt.accountHash,
      obtainedAt.tabName,
      obtainedAt.entryName,
      obtainedAt.itemId,
    ],
    references: [item.accountHash, item.tabName, item.entryName, item.id],
  }),
  killCounts: many(obtainedAtKillCount),
}));

export const obtainedAtKillCount = mysqlTable(
  "ObtainedAtKillCount",
  {
    index: int("index").notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    count: int("count").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    tabName: varchar("tabName", { length: 191 }).notNull(),
    entryName: varchar("entryName", { length: 191 }).notNull(),
    itemId: int("itemId").notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
  },
  (table) => {
    return {
      accountHashTabNameEntryNameItemIdIdx: index(
        "ObtainedAtKillCount_accountHash_tabName_entryName_itemId_idx"
      ).on(table.accountHash, table.tabName, table.entryName, table.itemId),
      obtainedAtKillCountAccountHashEntryNameItemIdNameTabName: primaryKey(
        table.accountHash,
        table.entryName,
        table.itemId,
        table.name,
        table.tabName
      ),
    };
  }
);

export const obtainedAtKillCountRelations = relations(
  obtainedAtKillCount,
  ({ one }) => ({
    obtainedAt: one(obtainedAt, {
      fields: [
        obtainedAtKillCount.accountHash,
        obtainedAtKillCount.tabName,
        obtainedAtKillCount.entryName,
        obtainedAtKillCount.itemId,
      ],
      references: [
        obtainedAt.accountHash,
        obtainedAt.tabName,
        obtainedAt.entryName,
        obtainedAt.itemId,
      ],
    }),
  })
);
