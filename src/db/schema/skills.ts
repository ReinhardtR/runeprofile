import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { accSkills } from "~/db/schema/acc-skills";

export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }).unique().notNull(),
  orderIdx: integer("order_idx").notNull(),
  metaApproved: integer("meta_approved", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const skillsRelations = relations(skills, ({ many }) => ({
  accSkills: many(accSkills),
}));
