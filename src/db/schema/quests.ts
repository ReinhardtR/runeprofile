import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { accQuests } from "~/db/schema/acc-quests";

const QUEST_TYPE = {
  F2P: "f2p",
  P2P: "p2p",
  MINI: "mini",
  UNKNOWN: "unknown",
} as const;
export type QuestType = keyof typeof QUEST_TYPE;

export const quests = sqliteTable("quests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }).unique().notNull(),
  type: text("type", {
    enum: Object.values(QUEST_TYPE) as [string, ...string[]],
  }).notNull(),
  orderIdx: integer("order_idx").notNull(),
  metaApproved: integer("meta_approved", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const questsRelation = relations(quests, ({ many }) => ({
  accQuests: many(accQuests),
}));
