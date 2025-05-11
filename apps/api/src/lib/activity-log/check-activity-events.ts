import {
  AchievementDiaryTierCompletedEvent,
  ActivityEvent,
  CombatAchievementTierCompletedEvent,
  LevelUpEvent,
  NewItemObtainedEvent,
  QuestCompletedEvent,
  QuestState,
  getAchievementDiaryTierTaskCount,
  getCombatAchievementTierTaskCount,
  getLevelFromXP,
} from "@runeprofile/runescape";

import { ProfileUpdates } from "~/lib/profiles/get-profile-updates";

export function checkActivityEvents(updates: ProfileUpdates) {
  if (updates.newAccount) return [];

  const events: ActivityEvent[] = [
    ...checkLevelUpEvents(updates.skills),
    ...checkNewItemObtainedEvents(updates.items),
    ...checkAchievementDiaryTierCompletedEvents(updates.achievementDiaryTiers),
    ...checkCombatAchievementTierCompletedEvents(
      updates.combatAchievementTiers,
    ),
    ...checkQuestCompletedEvents(updates.quests),
  ];
  return events;
}

const levelUpMilestones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99];

export function checkLevelUpEvents(skillUpdates: ProfileUpdates["skills"]) {
  const events: LevelUpEvent[] = [];

  for (const skillUpdate of skillUpdates) {
    const oldLevel = getLevelFromXP(skillUpdate.oldXp);
    const newLevel = getLevelFromXP(skillUpdate.xp);

    const milestone = levelUpMilestones.findLast(
      (milestone) => oldLevel < milestone && newLevel >= milestone,
    );

    if (!milestone) continue;

    events.push({
      type: "level_up",
      data: {
        name: skillUpdate.name,
        level: milestone,
      },
    });
  }

  return events;
}

export function checkNewItemObtainedEvents(
  itemUpdates: ProfileUpdates["items"],
) {
  const events: NewItemObtainedEvent[] = [];

  for (const itemUpdate of itemUpdates) {
    // already obtained
    if (itemUpdate.oldQuantity > 0) continue;
    // not obtained
    if (itemUpdate.quantity <= 0) continue;
    events.push({
      type: "new_item_obtained",
      data: {
        itemId: itemUpdate.id,
      },
    });
  }

  return events;
}

export function checkAchievementDiaryTierCompletedEvents(
  achievementDiaryTierUpdates: ProfileUpdates["achievementDiaryTiers"],
) {
  const events: AchievementDiaryTierCompletedEvent[] = [];

  for (const tierUpdate of achievementDiaryTierUpdates) {
    const tierTaskCount = getAchievementDiaryTierTaskCount(
      tierUpdate.areaId,
      tierUpdate.tier,
    );
    if (tierTaskCount === undefined) continue;
    // already completed
    if (tierUpdate.oldCompletedCount >= tierTaskCount) continue;
    // not completed
    if (tierUpdate.completedCount < tierTaskCount) continue;
    events.push({
      type: "achievement_diary_tier_completed",
      data: {
        areaId: tierUpdate.areaId,
        tier: tierUpdate.tier,
      },
    });
  }

  return events;
}

export function checkCombatAchievementTierCompletedEvents(
  combatAchievementTierUpdates: ProfileUpdates["combatAchievementTiers"],
) {
  const events: CombatAchievementTierCompletedEvent[] = [];

  for (const tierUpdate of combatAchievementTierUpdates) {
    const tierTaskCount = getCombatAchievementTierTaskCount(tierUpdate.id);
    if (tierTaskCount === undefined) continue;
    // already completed
    if (tierUpdate.oldCompletedCount >= tierTaskCount) continue;
    // not completed
    if (tierUpdate.completedCount < tierTaskCount) continue;

    events.push({
      type: "combat_achievement_tier_completed",
      data: {
        tierId: tierUpdate.id,
      },
    });
  }

  return events;
}

export function checkQuestCompletedEvents(
  questUpdates: ProfileUpdates["quests"],
) {
  const events: QuestCompletedEvent[] = [];

  for (const questUpdate of questUpdates) {
    // already completed
    if (questUpdate.oldState === QuestState.FINISHED) continue;
    // not completed
    if (questUpdate.state !== QuestState.FINISHED) continue;
    events.push({
      type: "quest_completed",
      data: {
        questId: questUpdate.id,
      },
    });
  }

  return events;
}
