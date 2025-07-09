import {
  AchievementDiaryTierCompletedEvent,
  ActivityEvent,
  CombatAchievementTierCompletedEvent,
  LevelUpEvent,
  MAX_SKILL_LEVEL,
  MAX_TOTAL_LEVEL,
  MaxedEvent,
  NewItemObtainedEvent,
  QuestCompletedEvent,
  QuestState,
  SKILLS,
  XpMilestoneEvent,
  getAchievementDiaryTierTaskCount,
  getCombatAchievementTierTaskCount,
  getLevelFromXP,
} from "@runeprofile/runescape";

import { Profile } from "~/lib/profiles/get-profile";
import { ProfileUpdates } from "~/lib/profiles/get-profile-updates";

export function checkActivityEvents(updates: ProfileUpdates) {
  if (!updates.currentProfile) return [];

  const events: Array<ActivityEvent> = [
    ...checkLevelUpEvents(updates.skills),
    ...checkXpMilestoneEvents(updates.skills),
    ...checkNewItemObtainedEvents(updates.currentProfile.items, updates.items),
    ...checkAchievementDiaryTierCompletedEvents(updates.achievementDiaryTiers),
    ...checkCombatAchievementTierCompletedEvents(
      updates.combatAchievementTiers,
    ),
    ...checkQuestCompletedEvents(updates.quests),

    checkMaxedEvent(updates.currentProfile.skills, updates.skills),
  ].filter((a) => a !== undefined);

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

const xpMilestones = [
  15_000_000, 20_000_000, 25_000_000, 30_000_000, 35_000_000, 40_000_000,
  45_000_000, 50_000_000, 55_000_000, 60_000_000, 65_000_000, 70_000_000,
  75_000_000, 80_000_000, 85_000_000, 90_000_000, 95_000_000, 100_000_000,
  105_000_000, 110_000_000, 115_000_000, 120_000_000, 125_000_000, 130_000_000,
  135_000_000, 140_000_000, 145_000_000, 150_000_000, 155_000_000, 160_000_000,
  165_000_000, 170_000_000, 175_000_000, 180_000_000, 185_000_000, 190_000_000,
  195_000_000, 200_000_000,
];

export function checkXpMilestoneEvents(skillUpdates: ProfileUpdates["skills"]) {
  const events: XpMilestoneEvent[] = [];

  for (const skillUpdate of skillUpdates) {
    const oldXp = skillUpdate.oldXp;
    const newXp = skillUpdate.xp;

    const milestone = xpMilestones.findLast(
      (milestone) => oldXp < milestone && newXp >= milestone,
    );

    if (!milestone) continue;

    events.push({
      type: "xp_milestone",
      data: {
        name: skillUpdate.name,
        xp: milestone,
      },
    });
  }

  return events;
}

const LATE_CLOG_INIT_THRESHOLD = 10;
export function checkNewItemObtainedEvents(
  currentItems: Profile["items"],
  itemUpdates: ProfileUpdates["items"],
) {
  const events: NewItemObtainedEvent[] = [];

  const isLateClogInit =
    currentItems.length === 0 && itemUpdates.length > LATE_CLOG_INIT_THRESHOLD;
  if (isLateClogInit) {
    return events; // assume there is so many new items, because of late clog init
  }

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

export function checkMaxedEvent(
  currentSkills: Profile["skills"],
  skillsUpdates: ProfileUpdates["skills"],
): MaxedEvent | undefined {
  const newMaxedSkills = skillsUpdates.filter(
    (s) =>
      getLevelFromXP(s.xp) >= MAX_SKILL_LEVEL &&
      getLevelFromXP(s.oldXp) < MAX_SKILL_LEVEL,
  );

  if (newMaxedSkills.length === 0) {
    return; // no new maxed skills
  }

  const currentMaxedSkills = currentSkills.filter(
    (s) => getLevelFromXP(s.xp) >= MAX_SKILL_LEVEL,
  );

  if (currentMaxedSkills.length * MAX_SKILL_LEVEL >= MAX_TOTAL_LEVEL) {
    return; // already maxed
  }

  // calculate new total level
  let totalLevel = 0;

  for (const skill of SKILLS) {
    const newXp = skillsUpdates.find((s) => s.name === skill)?.xp;

    if (newXp) {
      totalLevel += getLevelFromXP(newXp);
      continue;
    }

    const currentSkill = currentSkills.find((s) => s.name === skill);
    if (!currentSkill) continue;
    totalLevel += getLevelFromXP(currentSkill.xp);
  }

  // not maxed yet
  if (totalLevel < MAX_TOTAL_LEVEL) return;

  return { type: "maxed", data: {} };
}
