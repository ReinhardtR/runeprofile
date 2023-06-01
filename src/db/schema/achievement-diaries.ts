import {
  mysqlTable,
  uniqueIndex,
  varchar,
  mysqlEnum,
  tinyint,
  int,
  datetime,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { account } from "~/db/schema";

export const achievementDiary = mysqlTable(
  "AchievementDiary",
  {
    area: varchar("area", { length: 191 }).notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashIdx: index("AchievementDiary_accountHash_idx").on(
        table.accountHash
      ),
      achievementDiaryAccountHashArea: primaryKey(
        table.accountHash,
        table.area
      ),
    };
  }
);

export const achievementDiaryRelations = relations(
  achievementDiary,
  ({ one, many }) => ({
    account: one(account, {
      fields: [achievementDiary.accountHash],
      references: [account.accountHash],
    }),
    tiers: many(achievementDiaryTier),
  })
);

export const achievementDiaryTier = mysqlTable(
  "AchievementDiaryTier",
  {
    tier: mysqlEnum("tier", ["easy", "medium", "hard", "elite"]).notNull(),
    completed: int("completed").notNull(),
    total: int("total").notNull(),
    accountHash: varchar("accountHash", { length: 191 }).notNull(),
    area: varchar("area", { length: 191 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      accountHashAreaIdx: index("AchievementDiaryTier_accountHash_area_idx").on(
        table.accountHash,
        table.area
      ),
      achievementDiaryTierAccountHashAreaTier: primaryKey(
        table.accountHash,
        table.area,
        table.tier
      ),
    };
  }
);

export const achievementDiaryTierRelations = relations(
  achievementDiaryTier,
  ({ one }) => ({
    achievementDiary: one(achievementDiary, {
      fields: [achievementDiaryTier.accountHash, achievementDiaryTier.area],
      references: [achievementDiary.accountHash, achievementDiary.area],
    }),
  })
);
