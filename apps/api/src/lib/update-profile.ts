import { InferInsertModel, eq } from "drizzle-orm";

import {
  Database,
  accounts,
  achievementDiaryTiers,
  combatAchievementTiers,
  items,
  quests,
  skills,
} from "~/db";
import { autochunk, buildConflictUpdateColumns } from "~/db/helpers";
import {
  UpdateProfileInput,
  getProfileUpdates,
} from "~/lib/get-profile-updates";

export async function updateProfile(db: Database, input: UpdateProfileInput) {
  const updates = await getProfileUpdates(db, input);

  const accountId = updates.id;

  if (updates.newAccount) {
    await db.insert(accounts).values({
      id: updates.id,
      username: updates.username,
      accountType: updates.accountType,
    });
  }

  const achievementDiaryTiersValues: Array<
    InferInsertModel<typeof achievementDiaryTiers>
  > = updates.achievementDiaryTiers.map((diary) => ({
    accountId,
    areaId: diary.areaId,
    tier: diary.tierIndex,
    completedCount: diary.completedCount,
  }));

  const combatAchievementTiersValues: Array<
    InferInsertModel<typeof combatAchievementTiers>
  > = Object.entries(updates.combatAchievementTiers).map(
    ([id, completedCount]) => ({
      accountId,
      id: Number(id),
      completedCount,
    }),
  );

  const itemsValues: Array<InferInsertModel<typeof items>> = Object.entries(
    updates.items,
  ).map(([id, quantity]) => ({
    accountId,
    id: Number(id),
    quantity,
  }));

  const questsValues: Array<InferInsertModel<typeof quests>> = Object.entries(
    updates.quests,
  ).map(([id, state]) => ({
    accountId,
    id: Number(id),
    state,
  }));

  const skillsValues: Array<InferInsertModel<typeof skills>> = Object.entries(
    updates.skills,
  ).map(([name, xp]) => ({
    accountId,
    name,
    xp,
  }));

  await Promise.all([
    db
      .update(accounts)
      .set({
        username: updates.username,
        accountType: updates.accountType,
        clanName: updates.clan?.name,
        clanRank: updates.clan?.rank,
        clanIcon: updates.clan?.icon,
        clanTitle: updates.clan?.title,
      })
      .where(eq(accounts.id, accountId)),
    ...autochunk({ items: achievementDiaryTiersValues }, (chunk) =>
      db
        .insert(achievementDiaryTiers)
        .values(chunk)
        .onConflictDoUpdate({
          target: [
            achievementDiaryTiers.accountId,
            achievementDiaryTiers.areaId,
            achievementDiaryTiers.tier,
          ],
          set: buildConflictUpdateColumns(achievementDiaryTiers, [
            "completedCount",
          ]),
        }),
    ),
    ...autochunk({ items: combatAchievementTiersValues }, (chunk) =>
      db
        .insert(combatAchievementTiers)
        .values(chunk)
        .onConflictDoUpdate({
          target: [combatAchievementTiers.accountId, combatAchievementTiers.id],
          set: buildConflictUpdateColumns(combatAchievementTiers, [
            "completedCount",
          ]),
        }),
    ),
    ...autochunk({ items: itemsValues }, (chunk) =>
      db
        .insert(items)
        .values(chunk)
        .onConflictDoUpdate({
          target: [items.accountId, items.id],
          set: buildConflictUpdateColumns(items, ["quantity"]),
        }),
    ),
    ...autochunk({ items: questsValues }, (chunk) =>
      db
        .insert(quests)
        .values(chunk)
        .onConflictDoUpdate({
          target: [quests.accountId, quests.id],
          set: buildConflictUpdateColumns(quests, ["state"]),
        }),
    ),
    ...autochunk({ items: skillsValues }, (chunk) =>
      db
        .insert(skills)
        .values(chunk)
        .onConflictDoUpdate({
          target: [skills.accountId, skills.name],
          set: buildConflictUpdateColumns(skills, ["xp"]),
        }),
    ),
  ]);
}
