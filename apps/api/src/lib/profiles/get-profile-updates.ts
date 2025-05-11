import {
  ACHIEVEMENT_DIARIES,
  COLLECTION_LOG_ITEM_IDS,
  COMBAT_ACHIEVEMENT_TIERS,
  QUESTS,
  SKILLS,
} from "@runeprofile/runescape";

import { Database } from "~/db";
import { Profile, getProfileById } from "~/lib/profiles/get-profile";

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
  newAccount: boolean;
  username: string;
  accountType: number;
  clan?: {
    name: string;
    rank: number;
    icon: number;
    title: string;
  };
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

export async function getProfileUpdates(
  db: Database,
  input: UpdateProfileInput,
): Promise<ProfileUpdates> {
  let profile: Profile | null = null;
  try {
    profile = await getProfileById(db, input.id);
  } catch {}

  return {
    id: input.id,
    username: input.username,
    accountType: input.accountType,
    clan: input.clan,
    achievementDiaryTiers: getAchievementDiaryTierUpdates(
      input.achievementDiaryTiers,
      profile?.achievementDiaryTiers || [],
    ),
    combatAchievementTiers: getCombatAchievementTierUpdates(
      input.combatAchievementTiers,
      profile?.combatAchievementTiers || [],
    ),
    items: getItemUpdates(input.items, profile?.items || []),
    quests: getQuestUpdates(input.quests, profile?.quests || []),
    skills: getSkillUpdates(input.skills, profile?.skills || []),
    newAccount: !profile,
  };
}

export function getAchievementDiaryTierUpdates(
  newData: UpdateProfileInput["achievementDiaryTiers"],
  oldData: Profile["achievementDiaryTiers"],
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
  oldData: Profile["combatAchievementTiers"],
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
  oldData: Profile["items"],
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
  oldData: Profile["quests"],
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
  oldData: Profile["skills"],
): ProfileUpdates["skills"] {
  const updates: ProfileUpdates["skills"] = [];

  for (const skillName of SKILLS) {
    const newXp = newData[skillName];
    if (newXp === undefined || newXp === 0) {
      continue;
    }

    const oldSkill = oldData.find((skill) => skill.name === skillName);
    if (oldSkill && oldSkill.xp === newXp) {
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
