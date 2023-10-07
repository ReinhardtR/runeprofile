import { int, mysqlEnum, mysqlTable } from "drizzle-orm/mysql-core";

export const combatAchievementTiersEnum = mysqlEnum(
  "combat_achievement_tiers",
  ["easy", "medium", "hard", "elite", "master", "grandmaster"]
);

export const combatAchievementTiers = mysqlTable("combat_achievements", {
  tier: combatAchievementTiersEnum.primaryKey(),
  tasksTotal: int("tasks_total").notNull(),
});
