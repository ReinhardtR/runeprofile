// ids based on runescript:4784
export type CombatAchievementTier = {
  id: number;
  name: string;
  tasksCount: number;
};
export const COMBAT_ACHIEVEMENT_TIERS = [
  { id: 1, name: "Easy", tasksCount: 38 },
  { id: 2, name: "Medium", tasksCount: 55 },
  { id: 3, name: "Hard", tasksCount: 82 },
  { id: 4, name: "Elite", tasksCount: 158 },
  { id: 5, name: "Master", tasksCount: 163 },
  { id: 6, name: "Grandmaster", tasksCount: 114 },
] as const satisfies CombatAchievementTier[];

export function getCombatAchievementTierTaskCount(id: number) {
  return COMBAT_ACHIEVEMENT_TIERS.find((tier) => tier.id === id)?.tasksCount;
}

export function getCombatAchievementTierName(id: number) {
  return COMBAT_ACHIEVEMENT_TIERS.find((tier) => tier.id === id)?.name;
}
