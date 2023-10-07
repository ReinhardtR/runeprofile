import { index, int, mysqlTable } from "drizzle-orm/mysql-core";
import { accountHashColumn } from "~/db/schema/account";

export const accAchievementDiaries = mysqlTable(
  "acc_achievement_diaries",
  {
    accountHash: accountHashColumn,
    tasksCompletedTotal: int("tasks_completed_total").notNull(),
  },
  (table) => ({
    accountHashIdx: index("account_hash_idx").on(table.accountHash),
  })
);
