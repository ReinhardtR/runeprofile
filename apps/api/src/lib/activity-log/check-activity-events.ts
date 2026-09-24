import {
  AchievementDiaryTierCompletedEvent,
  ActivityEvent,
  CombatAchievementAccount,
  CombatAchievementTaskCompletedEvent,
  CombatAchievementTierReachedEvent,
  LevelUpEvent,
  MAX_SKILL_LEVEL,
  MAX_TOTAL_LEVEL,
  MaxedEvent,
  NewItemObtainedEvent,
  QuestCompletedEvent,
  QuestState,
  SKILLS,
  XpMilestoneEvent,
  calculateCombatAchievementPoints,
  decodeCombatAchievements,
  getAchievementDiaryTierTaskCount,
  getCombatAchievementTaskByIndex,
  getCombatAchievementTierReached,
  getLevelFromXP,
  getQuestById,
  legacy_calculateCombatAchievementPoints,
  toCombatAchievementAccount,
} from "@runeprofile/runescape";

import type { DiffProfile } from "~/lib/profiles/diff-cache";
import { ProfileUpdates } from "~/lib/profiles/get-profile-updates";

// Learning the Ropes (9643) was marked complete for every existing account
// when it was released, and is done on Tutorial Island before a profile
// exists, so a completion on an existing profile is never a real one.
const IGNORED_QUEST_COMPLETION_ACTIVITY_IDS = new Set([9643]);

/**
 * The account to judge combat achievement tiers against. Falls back to the
 * stored group size when the plugin didn't report one, so thresholds match
 * what the profile page shows and tiers aren't re-announced (or missed).
 */
export function getCombatAchievementAccountForUpdate(
  updates: Pick<
    ProfileUpdates,
    "accountType" | "gimGroupSize" | "storedGimGroupSize"
  >,
): CombatAchievementAccount {
  return toCombatAchievementAccount({
    accountType: updates.accountType,
    gimGroupSize:
      updates.gimGroupSize !== undefined
        ? updates.gimGroupSize
        : updates.storedGimGroupSize,
  });
}

export function checkActivityEvents(updates: ProfileUpdates) {
  if (!updates.currentProfile) return [];

  const events: Array<ActivityEvent> = [
    ...checkLevelUpEvents(updates.skills),
    ...checkXpMilestoneEvents(updates.skills),
    ...checkNewItemObtainedEvents(updates.currentProfile.items, updates.items),
    ...checkAchievementDiaryTierCompletedEvents(updates.achievementDiaryTiers),
    ...checkCombatAchievementEvents(
      updates.combatAchievementVarps,
      updates.currentProfile.combatAchievementTiers,
      getCombatAchievementAccountForUpdate(updates),
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

// NOTE: mirrored on the client in getBulkImportTimestamps
// (apps/web/src/features/profile/components/collection-log.tsx) so that
// displayed obtained dates match the activities recorded here. Keep both in
// sync if these thresholds change.
const LATE_CLOG_INIT_MIN_CURRENT_THRESHOLD = 10;
const LATE_CLOG_INIT_MAX_NEW_THRESHOLD = 10;
export function checkNewItemObtainedEvents(
  currentItems: DiffProfile["items"],
  itemUpdates: ProfileUpdates["items"],
) {
  const events: NewItemObtainedEvent[] = [];

  const isLateClogInit =
    currentItems.length < LATE_CLOG_INIT_MIN_CURRENT_THRESHOLD &&
    itemUpdates.length > LATE_CLOG_INIT_MAX_NEW_THRESHOLD;
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

/**
 * Generates tier-reached and task-completed events when varps are available.
 * When oldVarps is null (first update after plugin upgrade), estimates the
 * player's previous tier from legacy per-tier completion counts to avoid
 * false tier-reached events — individual task events are skipped entirely in
 * that case, since every previously completed task would look new.
 */
export function checkCombatAchievementEvents(
  varps: ProfileUpdates["combatAchievementVarps"],
  legacyTiers: DiffProfile["combatAchievementTiers"],
  account?: CombatAchievementAccount,
): Array<
  CombatAchievementTierReachedEvent | CombatAchievementTaskCompletedEvent
> {
  if (!varps.newVarps) return [];

  // If we have old varps, use exact comparison
  if (varps.oldVarps) {
    return [
      ...checkCombatAchievementTaskCompletedEvents(
        varps.oldVarps,
        varps.newVarps,
      ),
      ...checkCombatAchievementTierReachedEvents(
        varps.oldVarps,
        varps.newVarps,
        account,
      ),
    ];
  }

  // First update with varps — estimate old tier from legacy completion counts
  const oldEstimatedPoints =
    legacy_calculateCombatAchievementPoints(legacyTiers);
  const oldTier = getCombatAchievementTierReached(oldEstimatedPoints, account);

  const newCompleted = decodeCombatAchievements(varps.newVarps);
  const newPoints = calculateCombatAchievementPoints(newCompleted, account);
  const newTier = getCombatAchievementTierReached(newPoints, account);

  if (newTier !== null && newTier !== oldTier) {
    return [
      {
        type: "combat_achievement_tier_reached",
        data: { tierId: newTier },
      },
    ];
  }

  return [];
}

// When a single update completes more tasks than this, the diff is almost
// certainly a stale/expired diff cache or a long-offline player catching up —
// not a real completion spree — so individual task events are dropped
// (tier-reached events are still emitted).
const CA_TASK_EVENTS_MAX_PER_UPDATE = 20;

export function checkCombatAchievementTaskCompletedEvents(
  oldVarps: Record<string, number>,
  newVarps: Record<string, number>,
): CombatAchievementTaskCompletedEvent[] {
  const oldCompleted = new Set(decodeCombatAchievements(oldVarps));
  const newCompleted = decodeCombatAchievements(newVarps);

  const newlyCompleted = newCompleted.filter(
    (index) => !oldCompleted.has(index),
  );

  if (newlyCompleted.length > CA_TASK_EVENTS_MAX_PER_UPDATE) return [];

  return (
    newlyCompleted
      // Tasks not in our registry (e.g. brand-new releases before the task
      // data is synced) shouldn't produce activities.
      .filter((index) => getCombatAchievementTaskByIndex(index) !== undefined)
      .map((index) => ({
        type: "combat_achievement_task_completed" as const,
        data: { taskIndex: index },
      }))
  );
}

export function checkCombatAchievementTierReachedEvents(
  oldVarps: Record<string, number> | null,
  newVarps: Record<string, number>,
  account?: CombatAchievementAccount,
): CombatAchievementTierReachedEvent[] {
  const events: CombatAchievementTierReachedEvent[] = [];

  const oldCompleted = oldVarps ? decodeCombatAchievements(oldVarps) : [];
  const newCompleted = decodeCombatAchievements(newVarps);

  const oldPoints = calculateCombatAchievementPoints(oldCompleted, account);
  const newPoints = calculateCombatAchievementPoints(newCompleted, account);

  if (newPoints <= oldPoints) return events;

  const oldTier = getCombatAchievementTierReached(oldPoints, account);
  const newTier = getCombatAchievementTierReached(newPoints, account);

  if (newTier !== null && newTier !== oldTier) {
    events.push({
      type: "combat_achievement_tier_reached",
      data: { tierId: newTier },
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
    if (IGNORED_QUEST_COMPLETION_ACTIVITY_IDS.has(questUpdate.id)) {
      continue;
    }
    // Quests not in our registry (e.g. brand-new releases before the quest
    // data is synced) shouldn't produce activities.
    if (getQuestById(questUpdate.id) === undefined) continue;

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
  currentSkills: DiffProfile["skills"],
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
