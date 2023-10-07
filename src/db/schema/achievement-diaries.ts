import { index, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const achievementDiaryAreas = mysqlTable("achievement_diary_areas", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const achievementDiaries = mysqlTable(
  "achievement_diaries",
  {
    id: int("id").autoincrement().primaryKey(),
    areaId: int("area_id").notNull(),
    tier: varchar("tier", { length: 255 }).notNull(),
    tasksTotal: int("tasks_total").notNull(),
  },
  (table) => ({
    areaIdIdx: index("area_id_idx").on(table.areaId),
  })
);
