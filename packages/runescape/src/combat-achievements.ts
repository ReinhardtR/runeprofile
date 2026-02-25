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

export function getCombatAchievementTierTaskCount(id: number) {
  return COMBAT_ACHIEVEMENT_TIERS.find((tier) => tier.id === id)?.tasksCount;
}

export function getCombatAchievementTierName(id: number) {
  return COMBAT_ACHIEVEMENT_TIERS.find((tier) => tier.id === id)?.name;
}
