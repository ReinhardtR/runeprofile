import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const achievementDiaries = sqliteTable(
  "achievement_diaries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    area: text("area", { length: 255 }).notNull(),
    tier: text("tier", { length: 255 }).notNull(),
    tasksTotal: integer("tasks_total").notNull(),
    metaApproved: integer("meta_approved", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => ({
    areaTier: unique("area_tier").on(table.area, table.tier),
  })
);
