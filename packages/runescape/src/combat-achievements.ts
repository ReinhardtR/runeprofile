import { isGroupIronman } from "./account-types";

// ids based on runescript:4784
export type CombatAchievementTier = {
  id: number;
  name: string;
  tasksCount: number;
};
export const COMBAT_ACHIEVEMENT_TIERS = [
  { id: 1, name: "Easy", tasksCount: 41 },
  { id: 2, name: "Medium", tasksCount: 60 },
  { id: 3, name: "Hard", tasksCount: 85 },
  { id: 4, name: "Elite", tasksCount: 162 },
  { id: 5, name: "Master", tasksCount: 168 },
  { id: 6, name: "Grandmaster", tasksCount: 121 },
] as const satisfies CombatAchievementTier[];

// Number of tasks excluded per tier for Group Ironman accounts
const GIM_EXCLUDED_TASKS: Partial<Record<number, number>> = {
  6: 1,
};

export function getCombatAchievementTierTaskCount(
  id: number,
  accountTypeId?: number,
) {
  const tier = COMBAT_ACHIEVEMENT_TIERS.find((tier) => tier.id === id);
  if (!tier) return undefined;

  if (accountTypeId !== undefined && isGroupIronman(accountTypeId)) {
    const excluded = GIM_EXCLUDED_TASKS[id] ?? 0;
    return tier.tasksCount - excluded;
  }

  return tier.tasksCount;
}

export function getCombatAchievementTierName(id: number) {
  return COMBAT_ACHIEVEMENT_TIERS.find((tier) => tier.id === id)?.name;
}
