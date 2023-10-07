import { index, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { accountHashColumn } from "~/db/schema/account";

export const accHiscoresCategories = mysqlTable(
  "acc_hiscores_categories",
  {
    accountHash: accountHashColumn,
    leaderboard_id: int("leaderboard_id").notNull(),
    category_id: varchar("name", { length: 255 }).notNull(),
    score: int("score").notNull(),
    rank: int("rank").notNull(),
  },
  (table) => ({
    accountHashLeaderboardIdCategoryIdPk: index("account_hash_leaderboard_id_category_id_pk").on(table.accountHash, table.leaderboard_id, table.category_id),
    accountHashIdx: index("account_hash_idx").on(table.accountHash),
    leaderboardIdIdx: index("leaderboard_id_idx").on(table.leaderboard_id),
    categoryIdIdx: index("category_id_idx").on(table.category_id),
  })
);