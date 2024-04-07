import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { accounts } from "~/db/schema/account";
import { achievementDiaries } from "~/db/schema/achievement-diaries";

export const accAchievementDiaries = sqliteTable(
  "acc_achievement_diaries",
  {
    accountHash: text("account_hash", {
      length: 40,
    })
      .notNull()
      .references(() => accounts.accountHash, { onDelete: "cascade" }),
    diaryId: integer("diary_id")
      .notNull()
      .references(() => achievementDiaries.id),
    tasksCompleted: integer("tasks_completed").notNull(),
  },
  (table) => ({
    accountHashAreaTierPk: primaryKey({
      columns: [table.accountHash, table.diaryId],
    }),
  })
);

export const accAchievementDiariesRelations = relations(
  accAchievementDiaries,
  ({ one }) => ({
    account: one(accounts, {
      fields: [accAchievementDiaries.accountHash],
      references: [accounts.accountHash],
    }),
    achievementDiary: one(achievementDiaries, {
      fields: [accAchievementDiaries.diaryId],
      references: [achievementDiaries.id],
    }),
  })
);
