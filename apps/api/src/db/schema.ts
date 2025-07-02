import { relations } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { ActivityEvent } from "@runeprofile/runescape";

import { createdAt, lower, updatedAt } from "~/db/helpers";

export const accounts = sqliteTable(
  "accounts",
  {
    id: text().notNull().primaryKey(),
    username: text().notNull(),
    accountType: integer().notNull(),
    banned: integer({ mode: "boolean" }).notNull().default(false),
    clanName: text(),
    clanRank: integer(),
    clanIcon: integer(),
    clanTitle: text(),
    defaultClogPage: text(),
    updatedAt,
    createdAt,
  },
  (table) => [
    uniqueIndex("accounts_username_unique_index").on(lower(table.username)),
    index("accounts_clan_name_index").on(lower(table.clanName)),
    index("accounts_clan_members_sorted_index").on(
      lower(table.clanName),
      table.clanRank,
      lower(table.username),
    ),
  ],
);
export const accountsRelations = relations(accounts, ({ many }) => ({
  achievementDiaryTiers: many(achievementDiaryTiers),
  combatAchievementTiers: many(combatAchievementTiers),
  items: many(items),
  quests: many(quests),
  skills: many(skills),
  activities: many(activities),
}));

const account = () => accounts.id;

export const achievementDiaryTiers = sqliteTable(
  "achievement_diary_tiers",
  {
    accountId: text().notNull().references(account),
    areaId: integer().notNull(),
    tier: integer().notNull(),
    completedCount: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.accountId, table.areaId, table.tier] }),
    index("achievement_diary_tiers_account_id_index").on(table.accountId),
  ],
);
export const achievementDiariesRelations = relations(
  achievementDiaryTiers,
  ({ one }) => ({
    account: one(accounts, {
      fields: [achievementDiaryTiers.accountId],
      references: [accounts.id],
    }),
  }),
);

export const combatAchievementTiers = sqliteTable(
  "combat_achievement_tiers",
  {
    accountId: text().notNull().references(account),
    id: integer().notNull(),
    completedCount: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.accountId, table.id] }),
    index("combat_achievement_tiers_account_id_index").on(table.accountId),
  ],
);
export const combatAchievementTiersRelations = relations(
  combatAchievementTiers,
  ({ one }) => ({
    account: one(accounts, {
      fields: [combatAchievementTiers.accountId],
      references: [accounts.id],
    }),
  }),
);

export const items = sqliteTable(
  "items",
  {
    accountId: text().notNull().references(account),
    id: integer().notNull(),
    quantity: integer().notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.accountId, table.id] }),
    index("items_account_id_index").on(table.accountId),
  ],
);
export const itemsRelations = relations(items, ({ one }) => ({
  account: one(accounts, {
    fields: [items.accountId],
    references: [accounts.id],
  }),
}));

export const quests = sqliteTable(
  "quests",
  {
    accountId: text().notNull().references(account),
    id: integer().notNull(),
    state: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.accountId, table.id] }),
    index("quests_account_id_index").on(table.accountId),
  ],
);
export const questsRelations = relations(quests, ({ one }) => ({
  account: one(accounts, {
    fields: [quests.accountId],
    references: [accounts.id],
  }),
}));

export const skills = sqliteTable(
  "skills",
  {
    accountId: text().notNull().references(account),
    name: text().notNull(),
    xp: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.accountId, table.name] }),
    index("skills_account_id_index").on(table.accountId),
  ],
);
export const skillsRelations = relations(skills, ({ one }) => ({
  account: one(accounts, {
    fields: [skills.accountId],
    references: [accounts.id],
  }),
}));

export const activities = sqliteTable(
  "activities",
  {
    id: text().notNull().primaryKey(),
    accountId: text().notNull().references(account),
    type: text().notNull().$type<ActivityEvent["type"]>(),
    data: text({ mode: "json" }).notNull().$type<ActivityEvent["data"]>(),
    createdAt,
  },
  (table) => [
    index("activities_account_id_index").on(table.accountId),
    index("activities_account_id_created_at_index").on(
      table.accountId,
      table.createdAt,
    ),
    index("activities_account_id_type_created_at_index").on(
      table.accountId,
      table.type,
      table.createdAt,
    ),
  ],
);
export const activitiesRelations = relations(activities, ({ one }) => ({
  account: one(accounts, {
    fields: [activities.accountId],
    references: [accounts.id],
  }),
}));
