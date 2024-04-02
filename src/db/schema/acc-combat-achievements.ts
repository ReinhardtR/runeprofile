import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { accounts } from "~/db/schema/account";
import { combatAchievementTiers } from "~/db/schema/combat-achievements";

export const accCombatAchievementTiers = sqliteTable(
  "acc_ca_tiers",
  {
    accountHash: text("account_hash", {
      length: 40,
    })
      .notNull()
      .references(() => accounts.accountHash),
    tierId: integer("tier_id")
      .notNull()
      .references(() => combatAchievementTiers.id),
    tasksCompleted: integer("tasks_completed").notNull(),
  },
  (table) => ({
    accountHashCombatAchievementTierIdPk: primaryKey({
      columns: [table.accountHash, table.tierId],
    }),
  })
);

export const accCombatAchievementTiersRelations = relations(
  accCombatAchievementTiers,
  ({ one }) => ({
    account: one(accounts, {
      fields: [accCombatAchievementTiers.accountHash],
      references: [accounts.accountHash],
    }),
    combatAchievementTier: one(combatAchievementTiers, {
      fields: [accCombatAchievementTiers.tierId],
      references: [combatAchievementTiers.id],
    }),
  })
);
