import { eq } from "drizzle-orm";

import {
  Database,
  accounts,
  achievementDiaryTiers,
  activities,
  combatAchievementTiers,
  items,
  quests,
  skills,
} from "@runeprofile/db";

import { RuneProfileAccountNotFoundError } from "~/lib/errors";

export async function deleteProfile(db: Database, id: string) {
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
    columns: {
      username: true,
    },
  });

  if (!account) {
    throw RuneProfileAccountNotFoundError;
  }

  // delete references to the account
  await Promise.all([
    db
      .delete(achievementDiaryTiers)
      .where(eq(achievementDiaryTiers.accountId, id)),
    db
      .delete(combatAchievementTiers)
      .where(eq(combatAchievementTiers.accountId, id)),
    db.delete(items).where(eq(items.accountId, id)),
    db.delete(quests).where(eq(quests.accountId, id)),
    db.delete(skills).where(eq(skills.accountId, id)),
    db.delete(activities).where(eq(activities.accountId, id)),
  ]);

  await db.delete(accounts).where(eq(accounts.id, id));

  return account;
}
