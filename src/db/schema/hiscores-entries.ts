import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const hiscoresEntries = sqliteTable(
  "hiscores_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gameMode: text("game_mode", { length: 255 }).notNull(),
    activity: text("activity", { length: 255 }).notNull(),
    orderIdx: integer("order_idx").notNull(),
    metaApproved: integer("meta_approved", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => ({
    gameModeActivityUniqueIdx: unique("game_mode_activity_unique_idx").on(
      table.gameMode,
      table.activity
    ),
  })
);
