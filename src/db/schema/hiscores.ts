import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const hiscores_leaderbords = mysqlTable("hiscores_leaderbords", {
  id: int("id").autoincrement().primaryKey(),
  game_mode: varchar("game_mode", { length: 255 }).notNull(),
  order_idx: int("order_idx").notNull(),
})

export const hiscores_activities = mysqlTable("hiscores_activities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  order_idx: int("order_idx").notNull(),
})