import { InferInsertModel, eq } from "drizzle-orm";

import {
  ACHIEVEMENT_DIARIES,
  COLLECTION_LOG_ITEM_IDS,
  COMBAT_ACHIEVEMENT_TIERS,
  QUESTS,
  SKILLS,
} from "@runeprofile/runescape";

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

type UpdateProfileInput = {
  id: string;
  username: string;
  accountType: number;
  achievementDiaryTiers: Array<{
    areaId: number;
    tier: number;
    completedCount: number;
  }>;
  // id -> completedCount
  combatAchievementTiers: Record<number, number>;
  // id -> quantity
  items: Record<number, number>;
  // id -> state
  quests: Record<number, number>;
  // name -> xp
  skills: Record<string, number>;
};

export async function updateProfile(db: Database, account: UpdateProfileInput) {
  const accountId = account.id;

  const existingAccount = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
  });

  if (!existingAccount) {
    await db.insert(accounts).values({
      id: account.id,
      username: account.username,
      accountType: account.accountType,
    });
  }

  const achievementDiaryTiersValues: Array<
    InferInsertModel<typeof achievementDiaryTiers>
  > = [];
  for (const diary of ACHIEVEMENT_DIARIES) {
    const playerDiary = account.achievementDiaryTiers.find(
      (input) => input.areaId === diary.id,
    );
    if (!playerDiary) continue;
    if (playerDiary.completedCount === 0) continue; // None completed
    if (!diary.tiers[playerDiary.tier]) continue; // Invalid tier
    achievementDiaryTiersValues.push({
      accountId,
      areaId: diary.id,
      tier: playerDiary.tier,
      completedCount: playerDiary.completedCount,
    });
  }

  const combatAchievementTiersValues: Array<
    InferInsertModel<typeof combatAchievementTiers>
  > = [];
  for (const tier of COMBAT_ACHIEVEMENT_TIERS) {
    const completedCount = account.combatAchievementTiers[tier.id];
    if (completedCount === undefined) continue;
    if (completedCount === 0) continue; // None completed
    combatAchievementTiersValues.push({
      accountId,
      id: tier.id,
      completedCount,
    });
  }

  const itemsValues: Array<InferInsertModel<typeof items>> = [];
  for (const itemId of COLLECTION_LOG_ITEM_IDS) {
    const quantity = account.items[itemId];
    if (quantity === undefined) continue;
    if (quantity === 0) continue; // Not obtained
    itemsValues.push({
      accountId,
      id: itemId,
      quantity,
    });
  }

  const questsValues: Array<InferInsertModel<typeof quests>> = [];
  for (const quest of QUESTS) {
    const state = account.quests[quest.id];
    if (state === undefined) continue;
    if (state === 0) continue; // Not started
    questsValues.push({
      accountId,
      id: quest.id,
      state,
    });
  }

  const skillsValues: Array<InferInsertModel<typeof skills>> = [];
  for (const skillName in SKILLS) {
    const xp = account.skills[skillName];
    if (xp === undefined) continue;
    if (xp === 0) continue; // No xp
    skillsValues.push({
      accountId,
      name: skillName,
      xp,
    });
  }

  await Promise.all([
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
