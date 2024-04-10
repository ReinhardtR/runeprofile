import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { accAchievementDiaries } from "~/db/schema/acc-achievement-diaries";
import {
  accClogItemObtainedKcs,
  accClogItems,
  accClogKcs,
} from "~/db/schema/acc-collection-log";
import { accCombatAchievementTiers } from "~/db/schema/acc-combat-achievements";
import { accHiscoresEntries } from "~/db/schema/acc-hiscores-entries";
import { accQuests } from "~/db/schema/acc-quests";
import { accSkills } from "~/db/schema/acc-skills";

const AccountTypeEnum = [
  "normal",
  "ironman",
  "hardcore_ironman",
  "ultimate_ironman",
  "group_ironman",
  "hardcore_group_ironman",
  "unranked_group_ironman",
] as const;
export type SchemaAccountType = (typeof AccountTypeEnum)[number];

export const accounts = sqliteTable("accounts", {
  accountHash: text("account_hash", { length: 40 }).notNull().primaryKey(),
  accountType: text("account_type", { enum: AccountTypeEnum }).notNull(),
  username: text("username", { length: 12 }).unique().notNull(),
  generatedUrlPath: text("generated_url_path", { length: 16 }).unique(),
  modelUri: text("model_uri", { length: 255 }),
  description: text("description", { length: 255 }),
  questPoints: integer("quest_points").notNull(),
  isPrivate: integer("is_private", { mode: "boolean" })
    .notNull()
    .default(false),
  isBanned: integer("is_banned", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  skills: many(accSkills),
  quests: many(accQuests),
  hiscoresEntries: many(accHiscoresEntries),
  combatAchievementTiers: many(accCombatAchievementTiers),
  achievementDiaries: many(accAchievementDiaries),
  clogItems: many(accClogItems),
  clogKcs: many(accClogKcs),
  clogItemObtainedKcs: many(accClogItemObtainedKcs),
}));
