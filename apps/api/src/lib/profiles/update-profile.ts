import { InferInsertModel, eq } from "drizzle-orm";

import {
  Database,
  accounts,
  achievementDiaryTiers,
  activities,
  combatAchievementTiers,
  items,
  quests,
  skills,
} from "~/db";
import { autochunk, buildConflictUpdateColumns } from "~/db/helpers";
import { checkActivityEvents } from "~/lib/activity-log/check-activity-events";
import {
  UpdateProfileInput,
  getProfileUpdates,
} from "~/lib/profiles/get-profile-updates";

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

  const activityEvents = checkActivityEvents(updates);
  const activitiesValues: Array<InferInsertModel<typeof activities>> =
    activityEvents.map((activity) => ({
      id: crypto.randomUUID(),
      accountId,
      type: activity.type,
      data: activity.data,
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
    ...autochunk({ items: activitiesValues }, (chunk) =>
      db.insert(activities).values(chunk),
    ),
  ]);
}
