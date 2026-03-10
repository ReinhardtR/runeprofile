import { eq } from "drizzle-orm";

import { Database, accounts } from "@runeprofile/db";
import {
  ACHIEVEMENT_DIARIES,
  COLLECTION_LOG_ITEM_IDS,
  COMBAT_ACHIEVEMENT_TIERS,
  QUESTS,
  SKILLS,
} from "@runeprofile/runescape";

import {
  DiffProfile,
  getDiffProfileFromCache,
  setDiffProfileCache,
} from "~/lib/profiles/diff-cache";

export type UpdateProfileInput = {
  id: string;
  username: string;
  accountType: number;
  clan?: {
    name: string;
    rank: number;
    icon: number;
    title: string;
  };
  groupName?: string;
  achievementDiaryTiers: Array<{
    areaId: number;
    tierIndex: number;
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

export type ProfileUpdates = {
  id: string;
  currentProfile: DiffProfile | null;
  username: string;
  accountType: number;
  clan?: {
    name: string;
    rank: number;
    icon: number;
    title: string;
  };
  groupName?: string;
  achievementDiaryTiers: Array<{
    areaId: number;
    tier: number;
    completedCount: number;
    oldCompletedCount: number;
  }>;
  combatAchievementTiers: Array<{
    id: number;
    completedCount: number;
    oldCompletedCount: number;
  }>;
  items: Array<{
    id: number;
    quantity: number;
    oldQuantity: number;
  }>;
  quests: Array<{
    id: number;
    state: number;
    oldState: number;
  }>;
  skills: Array<{
    name: string;
    xp: number;
    oldXp: number;
  }>;
};

async function getProfileForDiff(
  db: Database,
  id: string,
): Promise<DiffProfile | null> {
  const result = await db.query.accounts.findFirst({
    where: (fields, { eq }) => eq(fields.id, id),
    columns: { username: true, updatedAt: true },
    with: {
      achievementDiaryTiers: {
        columns: { areaId: true, tier: true, completedCount: true },
      },
      combatAchievementTiers: {
        columns: { id: true, completedCount: true },
      },
      items: { columns: { id: true, quantity: true } },
      quests: { columns: { id: true, state: true } },
      skills: { columns: { name: true, xp: true } },
    },
  });

  if (!result) return null;

  return {
    username: result.username,
    updatedAt: result.updatedAt,
    achievementDiaryTiers: result.achievementDiaryTiers.map((t) => ({
      areaId: t.areaId,
      tierIndex: t.tier,
      completedCount: t.completedCount,
    })),
    combatAchievementTiers: result.combatAchievementTiers,
    items: result.items,
    quests: result.quests,
    skills: result.skills,
  };
}

export async function getProfileUpdates(
  db: Database,
  kv: KVNamespace,
  input: UpdateProfileInput,
): Promise<ProfileUpdates> {
  // Try KV cache first, fall back to lightweight DB query
  let diffProfile: DiffProfile | null = null;

  try {
    diffProfile = await getDiffProfileFromCache(kv, input.id);
    console.log(
      `Cache ${diffProfile ? "hit" : "miss"} for profile diff with ID: ${input.id}`,
    );
  } catch {
    // KV read failed, fall through to DB
    console.log(`Failed to read diff profile from cache for ID: ${input.id}`);
  }

  if (diffProfile) {
    // Validate cache against DB timestamp
    try {
      const row = await db
        .select({ updatedAt: accounts.updatedAt })
        .from(accounts)
        .where(eq(accounts.id, input.id))
        .limit(1);

      const dbUpdatedAt = row[0]?.updatedAt;
      if (!dbUpdatedAt || dbUpdatedAt !== diffProfile.updatedAt) {
        // Cache is inconsistent with DB — discard and fetch fresh
        console.log(
          `Cache invalid for ID: ${input.id}. DB updatedAt: ${dbUpdatedAt}, Cache updatedAt: ${diffProfile.updatedAt}`,
        );
        diffProfile = null;
      }
    } catch {
      // Timestamp check failed, discard cache to be safe
      diffProfile = null;
    }
  }

  if (!diffProfile) {
    diffProfile = await getProfileForDiff(db, input.id);

    if (diffProfile) {
      try {
        await setDiffProfileCache(kv, input.id, diffProfile);
      } catch {
        // Non-critical: cache will be populated after successful update
        console.log(`Failed to set diff profile cache for ID: ${input.id}`);
      }
    }
  }

  return {
    id: input.id,
    username: input.username,
    accountType: input.accountType,
    clan: input.clan,
    groupName: input.groupName,
    achievementDiaryTiers: getAchievementDiaryTierUpdates(
      input.achievementDiaryTiers,
      diffProfile?.achievementDiaryTiers || [],
    ),
    combatAchievementTiers: getCombatAchievementTierUpdates(
      input.combatAchievementTiers,
      diffProfile?.combatAchievementTiers || [],
    ),
    items: getItemUpdates(input.items, diffProfile?.items || []),
    quests: getQuestUpdates(input.quests, diffProfile?.quests || []),
    skills: getSkillUpdates(input.skills, diffProfile?.skills || []),
    currentProfile: diffProfile,
  };
}

export function getAchievementDiaryTierUpdates(
  newData: UpdateProfileInput["achievementDiaryTiers"],
  oldData: DiffProfile["achievementDiaryTiers"],
): ProfileUpdates["achievementDiaryTiers"] {
  const updates: ProfileUpdates["achievementDiaryTiers"] = [];

  for (const diary of ACHIEVEMENT_DIARIES) {
    for (const [tierIndex] of diary.tiers.entries()) {
      const newTier = newData.find(
        (t) => t.areaId === diary.id && t.tierIndex === tierIndex,
      );
      if (!newTier) continue;
      if (newTier.completedCount === 0) continue;

      const oldTier = oldData.find(
        (t) => t.areaId === diary.id && t.tierIndex === tierIndex,
      );
      if (oldTier && oldTier.completedCount === newTier.completedCount) {
        continue;
      }

      updates.push({
        areaId: diary.id,
        tier: tierIndex,
        completedCount: newTier.completedCount,
        oldCompletedCount: oldTier?.completedCount || 0,
      });
    }
  }

  return updates;
}

export function getCombatAchievementTierUpdates(
  newData: UpdateProfileInput["combatAchievementTiers"],
  oldData: DiffProfile["combatAchievementTiers"],
): ProfileUpdates["combatAchievementTiers"] {
  const updates: ProfileUpdates["combatAchievementTiers"] = [];

  for (const tier of COMBAT_ACHIEVEMENT_TIERS) {
    const newCompletedCount = newData[tier.id];
    if (newCompletedCount === undefined || newCompletedCount === 0) {
      continue;
    }

    const oldTier = oldData.find((t) => t.id === tier.id);
    if (oldTier && oldTier.completedCount === newCompletedCount) {
      continue;
    }

    updates.push({
      id: tier.id,
      completedCount: newCompletedCount,
      oldCompletedCount: oldTier?.completedCount || 0,
    });
  }

  return updates;
}

export function getItemUpdates(
  newData: UpdateProfileInput["items"],
  oldData: DiffProfile["items"],
): ProfileUpdates["items"] {
  const updates: ProfileUpdates["items"] = [];

  for (const itemId of COLLECTION_LOG_ITEM_IDS) {
    const newQuantity = newData[itemId];
    if (newQuantity === undefined || newQuantity === 0) {
      continue;
    }

    const oldItem = oldData.find((item) => item.id === itemId);
    if (oldItem && oldItem.quantity === newQuantity) {
      continue;
    }

    updates.push({
      id: itemId,
      quantity: newQuantity,
      oldQuantity: oldItem?.quantity || 0,
    });
  }

  return updates;
}

export function getQuestUpdates(
  newData: UpdateProfileInput["quests"],
  oldData: DiffProfile["quests"],
): ProfileUpdates["quests"] {
  const updates: ProfileUpdates["quests"] = [];

  for (const quest of QUESTS) {
    const newState = newData[quest.id];
    if (newState === undefined || newState === 0) {
      continue;
    }

    const oldQuest = oldData.find((q) => q.id === quest.id);
    if (oldQuest && oldQuest.state === newState) {
      continue;
    }

    updates.push({
      id: quest.id,
      state: newState,
      oldState: oldQuest?.state || 0,
    });
  }

  return updates;
}

export function getSkillUpdates(
  newData: UpdateProfileInput["skills"],
  oldData: DiffProfile["skills"],
): ProfileUpdates["skills"] {
  const updates: ProfileUpdates["skills"] = [];

  for (const skillName of SKILLS) {
    const newXp = newData[skillName];
    if (newXp === undefined || newXp === 0) {
      continue;
    }

    const oldSkill = oldData.find((skill) => skill.name === skillName);
    if (oldSkill && oldSkill.xp >= newXp) {
      continue;
    }

    updates.push({
      name: skillName,
      xp: newXp,
      oldXp: oldSkill?.xp || 0,
    });
  }

  return updates;
}
