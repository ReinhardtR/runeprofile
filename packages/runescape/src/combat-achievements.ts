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
  { id: 4, name: "Elite", tasksCount: 155 },
  { id: 5, name: "Master", tasksCount: 158 },
  { id: 6, name: "Grandmaster", tasksCount: 111 },
] as const satisfies CombatAchievementTier[];
