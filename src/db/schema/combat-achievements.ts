import {
  mysqlTable,
  varchar,
  mysqlEnum,
  int,
  datetime,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

export const combatAchievements = mysqlTable(
  "CombatAchievements",
  {
    accountHash: varchar("accountHash", { length: 191 }).primaryKey().notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("CombatAchievements_accountHash_idx").on(
        table.accountHash
      ),
    };
  }
);

export const combatAchievementRelations = relations(
  combatAchievements,
  ({ many }) => ({
    tiers: many(combatAchievementTier),
  })
);

export const combatAchievementTier = mysqlTable(
  "CombatAchievementTier",
  {
    tier: mysqlEnum("tier", [
      "easy",
      "medium",
      "hard",
      "elite",
      "master",
      "grandmaster",
    ]).notNull(),
    completed: int("completed").notNull(),
    total: int("total").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("CombatAchievementTier_accountHash_idx").on(
        table.accountHash
      ),
      combatAchievementTierAccountHashTier: primaryKey(
        table.accountHash,
        table.tier
      ),
    };
  }
);

export const combatAchievementTierRelations = relations(
  combatAchievementTier,
  ({ one }) => ({
    combatAchievements: one(combatAchievements, {
      fields: [combatAchievementTier.accountHash],
      references: [combatAchievements.accountHash],
    }),
  })
);
