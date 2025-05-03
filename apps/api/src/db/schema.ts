import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

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
    updatedAt,
    createdAt,
  },
  (table) => [uniqueIndex("username_unique_index").on(lower(table.username))],
);
export const accountsRelations = relations(accounts, ({ many }) => ({
  achievementDiaryTiers: many(achievementDiaryTiers),
  combatAchievementTiers: many(combatAchievementTiers),
  items: many(items),
  quests: many(quests),
  skills: many(skills),
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
  (table) => [primaryKey({ columns: [table.accountId, table.id] })],
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
  (table) => [primaryKey({ columns: [table.accountId, table.id] })],
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
  (table) => [primaryKey({ columns: [table.accountId, table.id] })],
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
  (table) => [primaryKey({ columns: [table.accountId, table.name] })],
);
export const skillsRelations = relations(skills, ({ one }) => ({
  account: one(accounts, {
    fields: [skills.accountId],
    references: [accounts.id],
  }),
}));
