import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const combatAchievementTiers = sqliteTable("combat_achievement_tiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tier: text("combat_achievement_tier", { length: 255 }).unique().notNull(),
  tasksTotal: integer("tasks_total").notNull(),
  metaApproved: integer("meta_approved", { mode: "boolean" })
    .notNull()
    .default(false),
});
