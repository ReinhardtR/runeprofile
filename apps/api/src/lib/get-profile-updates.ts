import {
  ACHIEVEMENT_DIARIES,
  COLLECTION_LOG_ITEM_IDS,
  COMBAT_ACHIEVEMENT_TIERS,
  QUESTS,
  SKILLS,
} from "@runeprofile/runescape";

import { Database } from "~/db";
import { RuneProfileAccountNotFoundError } from "~/lib/errors";
import { getProfile } from "~/lib/get-profile";

export type UpdateProfileInput = {
  id: string;
  username: string;
  accountType: number;
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

type Profile = Awaited<ReturnType<typeof getProfile>>;

export async function getProfileUpdates(
  db: Database,
  input: UpdateProfileInput,
): Promise<UpdateProfileInput> {
  try {
    const profile = await getProfile(db, input.username);
    return {
      id: input.id,
      username: input.username,
      accountType: input.accountType,
      achievementDiaryTiers: getAchievementDiaryTierUpdates(
        input.achievementDiaryTiers,
        profile.achievementDiaryTiers,
      ),
      combatAchievementTiers: getCombatAchievementTierUpdates(
        input.combatAchievementTiers,
        profile.combatAchievementTiers,
      ),
      items: getItemUpdates(input.items, profile.items),
      quests: getQuestUpdates(input.quests, profile.quests),
      skills: getSkillUpdates(input.skills, profile.skills),
    };
  } catch (error) {
    // No data to compare against
    if (error === RuneProfileAccountNotFoundError) {
      return input;
    }

    throw error;
  }
}

function getAchievementDiaryTierUpdates(
  newData: UpdateProfileInput["achievementDiaryTiers"],
  oldData: Profile["achievementDiaryTiers"],
) {
  const updates: UpdateProfileInput["achievementDiaryTiers"] = [];

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
        tierIndex: tierIndex,
        completedCount: newTier.completedCount,
      });
    }
  }

  return updates;
}

function getCombatAchievementTierUpdates(
  newData: UpdateProfileInput["combatAchievementTiers"],
  oldData: Profile["combatAchievementTiers"],
) {
  const updates: UpdateProfileInput["combatAchievementTiers"] = {};

  for (const tier of COMBAT_ACHIEVEMENT_TIERS) {
    const newCompletedCount = newData[tier.id];
    if (newCompletedCount === undefined || newCompletedCount === 0) {
      continue;
    }

    const oldTier = oldData.find((t) => t.id === tier.id);
    if (oldTier && oldTier.completedCount === newCompletedCount) {
      continue;
    }

    updates[tier.id] = newCompletedCount;
  }

  return updates;
}

function getItemUpdates(
  newData: UpdateProfileInput["items"],
  oldData: Profile["items"],
) {
  const updates: UpdateProfileInput["items"] = {};

  for (const itemId of COLLECTION_LOG_ITEM_IDS) {
    const newQuantity = newData[itemId];
    if (newQuantity === undefined || newQuantity === 0) {
      continue;
    }

    const oldItem = oldData.find((item) => item.id === itemId);
    if (oldItem && oldItem.quantity === newQuantity) {
      continue;
    }

    updates[itemId] = newQuantity;
  }

  return updates;
}

function getQuestUpdates(
  newData: UpdateProfileInput["quests"],
  oldData: Profile["quests"],
) {
  const updates: UpdateProfileInput["quests"] = {};

  for (const quest of QUESTS) {
    const newState = newData[quest.id];
    if (newState === undefined || newState === 0) {
      continue;
    }

    const oldQuest = oldData.find((q) => q.id === quest.id);
    if (oldQuest && oldQuest.state === newState) {
      continue;
    }

    console.log(
      `Quest ${quest.name} (${quest.id}) updated from ${oldQuest?.state} to ${newState}`,
    );

    updates[quest.id] = newState;
  }

  return updates;
}

function getSkillUpdates(
  newData: UpdateProfileInput["skills"],
  oldData: Profile["skills"],
) {
  const updates: UpdateProfileInput["skills"] = {};

  for (const skillName of SKILLS) {
    const newXp = newData[skillName];
    if (newXp === undefined || newXp === 0) {
      continue;
    }

    const oldSkill = oldData.find((skill) => skill.name === skillName);
    if (oldSkill && oldSkill.xp === newXp) {
      continue;
    }

    updates[skillName] = newXp;
  }

  return updates;
}
