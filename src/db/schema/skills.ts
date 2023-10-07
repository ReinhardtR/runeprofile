import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  orderIdx: int("order_idx").notNull(),
});
