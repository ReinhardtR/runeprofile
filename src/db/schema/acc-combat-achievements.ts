import {
  index,
  int,
  mysqlTable,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { accountHashColumn } from "~/db/schema/account";
import { combatAchievementTiersEnum } from "~/db/schema/combat-achievements";

export const accCombatAchievementTiers = mysqlTable(
  "acc_combat_achievement_tiers",
  {
    accountHash: accountHashColumn,
    tier: combatAchievementTiersEnum.notNull(),
    tasksCompletedTotal: int("tasks_completed_total").notNull(),
  },
  (table) => ({
    accountHashTierPk: primaryKey(table.accountHash, table.tier),
    accountHashIdx: index("account_hash_idx").on(table.accountHash),
    tierIdx: index("tier_idx").on(table.tier),
  })
);
