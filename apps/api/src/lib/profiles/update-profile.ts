import { InferInsertModel, eq } from "drizzle-orm";

import {
  Database,
  accounts,
  achievementDiaryTiers,
  activities,
  clanActivities,
  combatAchievementTiers,
  items,
  quests,
  skills,
  withValues,
} from "@runeprofile/db";
import { buildConflictUpdateColumns } from "@runeprofile/db";
import { ActivityEvent } from "@runeprofile/runescape";

import { renamePlayerModels } from "~/lib/models/manage-models";
import { ProfileUpdates } from "~/lib/profiles/get-profile-updates";

export async function updateProfile(
  db: Database,
  bucket: R2Bucket,
  updates: ProfileUpdates,
  activityEvents: ActivityEvent[],
): Promise<{ updatedAt: string }> {
  const accountId = updates.id;

  if (!updates.currentProfile) {
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
    tier: diary.tier,
    completedCount: diary.completedCount,
  }));

  const combatAchievementTiersValues = updates.combatAchievementTiers.map(
    (tier) => ({
      accountId,
      id: tier.id,
      completedCount: tier.completedCount,
    }),
  );

  const itemsValues: Array<InferInsertModel<typeof items>> = updates.items.map(
    (item) => ({
      accountId,
      id: item.id,
      quantity: item.quantity,
    }),
  );

  const questsValues: Array<InferInsertModel<typeof quests>> =
    updates.quests.map((quest) => ({
      accountId,
      id: quest.id,
      state: quest.state,
    }));

  const skillsValues: Array<InferInsertModel<typeof skills>> =
    updates.skills.map((skill) => ({
      accountId,
      name: skill.name,
      xp: skill.xp,
    }));

  const activitiesValues: Array<InferInsertModel<typeof activities>> =
    activityEvents.map((activity) => ({
      id: crypto.randomUUID(),
      accountId,
      type: activity.type,
      data: activity.data,
    }));

  const clanActivitiesValues: Array<InferInsertModel<typeof clanActivities>> =
    updates.clan?.name
      ? activitiesValues.map((activity) => ({
          activityId: activity.id,
          clanName: updates.clan?.name?.toLowerCase() ?? "",
        }))
      : [];

  let resultUpdatedAt: string | undefined;

  await db.transaction(async (tx) => {
    await Promise.all([
      tx
        .update(accounts)
        .set({
          username: updates.username,
          accountType: updates.accountType,
          clanName: updates.clan?.name ?? null,
          clanRank: updates.clan?.rank ?? null,
          clanIcon: updates.clan?.icon ?? null,
          clanTitle: updates.clan?.title ?? null,
          groupName: updates.groupName ?? null,
          forceResync: false,
        })
        .where(eq(accounts.id, accountId))
        .returning({ updatedAt: accounts.updatedAt })
        .then((rows) => {
          resultUpdatedAt = rows[0]?.updatedAt;
        }),
      withValues(achievementDiaryTiersValues, (values) =>
        tx
          .insert(achievementDiaryTiers)
          .values(values)
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
      withValues(combatAchievementTiersValues, (values) =>
        tx
          .insert(combatAchievementTiers)
          .values(values)
          .onConflictDoUpdate({
            target: [
              combatAchievementTiers.accountId,
              combatAchievementTiers.id,
            ],
            set: buildConflictUpdateColumns(combatAchievementTiers, [
              "completedCount",
            ]),
          }),
      ),
      withValues(itemsValues, (values) =>
        tx
          .insert(items)
          .values(values)
          .onConflictDoUpdate({
            target: [items.accountId, items.id],
            set: buildConflictUpdateColumns(items, ["quantity"]),
          }),
      ),
      withValues(questsValues, (values) =>
        tx
          .insert(quests)
          .values(values)
          .onConflictDoUpdate({
            target: [quests.accountId, quests.id],
            set: buildConflictUpdateColumns(quests, ["state"]),
          }),
      ),
      withValues(skillsValues, (values) =>
        tx
          .insert(skills)
          .values(values)
          .onConflictDoUpdate({
            target: [skills.accountId, skills.name],
            set: buildConflictUpdateColumns(skills, ["xp"]),
          }),
      ),
      withValues(activitiesValues, (values) =>
        tx.insert(activities).values(values),
      ),
      withValues(clanActivitiesValues, (values) =>
        tx.insert(clanActivities).values(values),
      ),
    ]);
  });

  // Rename player models if username changed
  if (
    updates.currentProfile &&
    updates.currentProfile.username !== updates.username
  ) {
    try {
      await renamePlayerModels(
        bucket,
        updates.currentProfile.username,
        updates.username,
      );
    } catch (error) {
      console.error("Failed to rename player models:", error);
    }
  }

  return { updatedAt: resultUpdatedAt ?? new Date().toISOString() };
}
