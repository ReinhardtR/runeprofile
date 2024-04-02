import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { accounts } from "~/db/schema/account";
import { skills } from "~/db/schema/skills";

export const accSkills = sqliteTable(
  "acc_skills",
  {
    accountHash: text("account_hash", {
      length: 40,
    })
      .notNull()
      .references(() => accounts.accountHash),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id),
    xp: integer("xp").notNull(),
  },
  (table) => ({
    accountHashSkillIdPk: primaryKey({
      columns: [table.accountHash, table.skillId],
    }),
  })
);

export const accSkillsRelations = relations(accSkills, ({ one }) => ({
  account: one(accounts, {
    fields: [accSkills.accountHash],
    references: [accounts.accountHash],
  }),
  skill: one(skills, {
    fields: [accSkills.skillId],
    references: [skills.id],
  }),
}));
