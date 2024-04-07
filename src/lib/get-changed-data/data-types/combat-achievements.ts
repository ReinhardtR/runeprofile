import { CombatAchievementsTierName } from "~/lib/domain/profile-data-types";

export type CombatAchievementTierChange = {
  tier: CombatAchievementsTierName;
  tasksTotal: number;
};

export type GetCombatAchievementTierChangesInputData = {
  tier: CombatAchievementsTierName;
  tasksTotal: number;
}[];

export function getCombatAchievementTierChanges(
  oldData: GetCombatAchievementTierChangesInputData | undefined,
  newData: GetCombatAchievementTierChangesInputData
): CombatAchievementTierChange[] {
  const changes: CombatAchievementTierChange[] = [];

  for (const newTier of newData) {
    const oldTier = oldData?.find((tier) => tier.tier === newTier.tier);

    if (
      !oldTier || //
      oldTier.tasksTotal !== newTier.tasksTotal
    ) {
      changes.push({
        tier: newTier.tier,
        tasksTotal: newTier.tasksTotal,
      });
      continue;
    }
  }

  return changes;
}

export type AccountCombatAchievementTierChange = {
  tier: CombatAchievementsTierName;
  tasksCompleted: number;
};

export type GetAccountCombatAchievementTierChangesInputData = {
  tier: CombatAchievementsTierName;
  tasksCompleted: number;
}[];

export function getAccountCombatAchievementTierChanges(
  oldData: GetAccountCombatAchievementTierChangesInputData | undefined,
  newData: GetAccountCombatAchievementTierChangesInputData
): AccountCombatAchievementTierChange[] {
  const changes: AccountCombatAchievementTierChange[] = [];

  for (const newTier of newData) {
    const oldTier = oldData?.find((tier) => tier.tier === newTier.tier);

    if (
      !oldTier || //
      oldTier.tasksCompleted !== newTier.tasksCompleted
    ) {
      changes.push({
        tier: newTier.tier,
        tasksCompleted: newTier.tasksCompleted,
      });
      continue;
    }
  }

  return changes;
}
