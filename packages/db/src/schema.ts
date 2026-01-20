import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

import { ActivityEvent } from "@runeprofile/runescape";

import { createdAt, lower, updatedAt } from "./helpers";

export const accounts = t.pgTable(
  "accounts",
  (t) => ({
    id: t.text().notNull().primaryKey(),
    username: t.text().notNull(),
    accountType: t.integer().notNull(),
    banned: t.boolean().notNull().default(false),
    clanName: t.text(),
    clanRank: t.integer(),
    clanIcon: t.integer(),
    clanTitle: t.text(),
    groupName: t.text(),
    defaultClogPage: t.text(),
    updatedAt,
    createdAt,
  }),
  (table) => [
    t.uniqueIndex("accounts_username_unique_index").on(lower(table.username)),
    t.index("accounts_clan_name_index").on(lower(table.clanName)),
    t.index("accounts_group_name_index").on(lower(table.groupName)),
    t
      .index("accounts_clan_members_sorted_index")
      .on(lower(table.clanName), table.clanRank, lower(table.username)),
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

export const achievementDiaryTiers = t.pgTable(
  "achievement_diary_tiers",
  {
    accountId: t.text().notNull().references(account),
    areaId: t.integer().notNull(),
    tier: t.integer().notNull(),
    completedCount: t.integer().notNull(),
  },
  (table) => [
    t.primaryKey({ columns: [table.accountId, table.areaId, table.tier] }),
    t.index("achievement_diary_tiers_account_id_index").on(table.accountId),
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

export const combatAchievementTiers = t.pgTable(
  "combat_achievement_tiers",
  {
    accountId: t.text().notNull().references(account),
    id: t.integer().notNull(),
    completedCount: t.integer().notNull(),
  },
  (table) => [
    t.primaryKey({ columns: [table.accountId, table.id] }),
    t.index("combat_achievement_tiers_account_id_index").on(table.accountId),
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

export const items = t.pgTable(
  "items",
  {
    accountId: t.text().notNull().references(account),
    id: t.integer().notNull(),
    quantity: t.integer().notNull(),
    createdAt,
  },
  (table) => [
    t.primaryKey({ columns: [table.accountId, table.id] }),
    t.index("items_account_id_index").on(table.accountId),
  ],
);
export const itemsRelations = relations(items, ({ one }) => ({
  account: one(accounts, {
    fields: [items.accountId],
    references: [accounts.id],
  }),
}));

export const quests = t.pgTable(
  "quests",
  {
    accountId: t.text().notNull().references(account),
    id: t.integer().notNull(),
    state: t.integer().notNull(),
  },
  (table) => [
    t.primaryKey({ columns: [table.accountId, table.id] }),
    t.index("quests_account_id_index").on(table.accountId),
  ],
);
export const questsRelations = relations(quests, ({ one }) => ({
  account: one(accounts, {
    fields: [quests.accountId],
    references: [accounts.id],
  }),
}));

export const skills = t.pgTable(
  "skills",
  {
    accountId: t.text().notNull().references(account),
    name: t.text().notNull(),
    xp: t.integer().notNull(),
  },
  (table) => [
    t.primaryKey({ columns: [table.accountId, table.name] }),
    t.index("skills_account_id_index").on(table.accountId),
  ],
);
export const skillsRelations = relations(skills, ({ one }) => ({
  account: one(accounts, {
    fields: [skills.accountId],
    references: [accounts.id],
  }),
}));

export const activities = t.pgTable(
  "activities",
  {
    id: t.text().notNull().primaryKey(),
    accountId: t.text().notNull().references(account),
    type: t.text().notNull().$type<ActivityEvent["type"]>(),
    data: t.json().notNull().$type<ActivityEvent["data"]>(),
    createdAt,
  },
  (table) => [
    t.index("activities_account_id_index").on(table.accountId),
    t
      .index("activities_account_id_created_at_index")
      .on(table.accountId, table.createdAt),
    t
      .index("activities_account_id_type_created_at_index")
      .on(table.accountId, table.type, table.createdAt),
  ],
);
export const activitiesRelations = relations(activities, ({ one }) => ({
  account: one(accounts, {
    fields: [activities.accountId],
    references: [accounts.id],
  }),
}));

// Discord-related tables
export const discordUsers = t.pgTable(
  "discord_users",
  {
    id: t.text().notNull().primaryKey(), // Discord user ID
    accountId: t.text().references(() => accounts.id), // Optional reference to main account
    rsn: t.text(), // Optional RuneScape username (for unregistered users only)
    createdAt,
  },
  (table) => [
    t.index("discord_users_account_id_index").on(table.accountId),
    t.index("discord_users_rsn_index").on(table.rsn),
  ],
);

export const discordUsersRelations = relations(discordUsers, ({ one }) => ({
  account: one(accounts, {
    fields: [discordUsers.accountId],
    references: [accounts.id],
  }),
}));

export const discordWatches = t.pgTable(
  "discord_watches",
  {
    id: t.text().notNull().primaryKey(),
    channelId: t.text().notNull(),
    targetType: t.text().notNull().$type<"clan" | "player">(),
    targetId: t.text().notNull(),
    createdAt,
  },
  (table) => [
    t
      .uniqueIndex("discord_watches_channel_target_unique_index")
      .on(table.channelId, table.targetType, table.targetId),
    t.index("discord_watches_channel_index").on(table.channelId),
    t
      .index("discord_watches_target_index")
      .on(table.targetType, table.targetId),
  ],
);

export const discordWatchesRelations = relations(discordWatches, ({ one }) => ({
  // Only applicable for player watches
  targetAccount: one(accounts, {
    fields: [discordWatches.targetId],
    references: [accounts.id],
  }),
}));
