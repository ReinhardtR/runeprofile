import { index, int, mysqlTable, primaryKey } from "drizzle-orm/mysql-core";
import { accountHashColumn } from "~/db/schema/account";

export const accSkills = mysqlTable("acc_skills", {
  accountHash: accountHashColumn,
  skillId: int("skill_id").notNull(),
  xp: int("xp").notNull(),
}, (table) => ({
  accountHashSkillIdPk: primaryKey(table.accountHash, table.skillId),
  accountHashIdx: index("account_hash_idx").on(table.accountHash),
}))