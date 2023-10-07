import {
  mysqlTable,
  uniqueIndex,
  varchar,
  mysqlEnum,
  int,
  datetime,
  boolean,
} from "drizzle-orm/mysql-core";

export const accounTypeEnum = mysqlEnum("accountType", [
  "normal",
  "ironman",
  "hardcore_ironman",
  "ultimate_ironman",
  "group_ironman",
  "hardcore_group_ironman",
  "unranked_group_ironman",
]);

export const accountHashColumn = varchar("account_hash", { length: 40 }).notNull();

export const accounts = mysqlTable(
  "accounts",
  {
    accountHash: accountHashColumn.primaryKey(),
    username: varchar("username", { length: 12 }).notNull(),
    accountType: accounTypeEnum.notNull(),
    generatedUrlPath: varchar("generated_url_path", { length: 16 }),
    modelUri: varchar("model_uri", { length: 255 }),
    description: varchar("description", { length: 255 }),
    questPoints: int("quest_points").notNull(),
    isPrivate: boolean("is_private").notNull().default(false),
    isBanned: boolean("is_banned").notNull().default(false),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("username_idx").on(table.username),
    generatedUrlPathIdx: uniqueIndex("generated_url_path_idx").on(
      table.generatedUrlPath
    ),
  })
);
