// ids based on runescript:2200
export type AchievementDiary = {
  id: number;
  name: string;
  // tasks count for each tier
  tiers: [number, number, number, number];
};
export const ACHIEVEMENT_DIARIES = [
  { id: 1, name: "Ardougne", tiers: [10, 12, 12, 8] },
  { id: 5, name: "Desert", tiers: [11, 12, 10, 6] },
  { id: 2, name: "Falador", tiers: [11, 14, 11, 6] },
  { id: 3, name: "Fremennik", tiers: [10, 9, 9, 6] },
  { id: 4, name: "Kandarin", tiers: [11, 14, 11, 7] },
  { id: 0, name: "Karamja", tiers: [10, 19, 10, 5] },
  { id: 11, name: "Kourend & Kebos", tiers: [12, 13, 10, 8] },
  { id: 6, name: "Lumbridge & Draynor", tiers: [12, 12, 11, 6] },
  { id: 7, name: "Morytania", tiers: [11, 11, 10, 6] },
  { id: 8, name: "Varrock", tiers: [14, 13, 10, 5] },
  { id: 10, name: "Western Provinces", tiers: [11, 13, 13, 7] },
  { id: 9, name: "Wilderness", tiers: [12, 11, 10, 7] },
] satisfies AchievementDiary[];

export const ACHIEVEMENT_DIARY_TIER_NAMES = ["Easy", "Medium", "Hard", "Elite"];
export type AchievementDiaryTierName =
  (typeof ACHIEVEMENT_DIARY_TIER_NAMES)[number];
