import { int, mysqlEnum, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const questTypeEnum = mysqlEnum("quest_type", ["f2p", "p2p", "mini"]);

export const quests = mysqlTable("quests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: questTypeEnum.notNull(),
  orderIdx: int("order_idx").notNull(),
});
