export const SKILLS = [
  "Attack",
  "Hitpoints",
  "Mining",
  "Strength",
  "Agility",
  "Smithing",
  "Defence",
  "Herblore",
  "Fishing",
  "Ranged",
  "Thieving",
  "Cooking",
  "Prayer",
  "Crafting",
  "Firemaking",
  "Magic",
  "Fletching",
  "Woodcutting",
  "Runecraft",
  "Slayer",
  "Farming",
  "Construction",
  "Hunter",
  "Sailing",
];

export const MAX_SKILL_XP = 200_000_000;
export const MAX_SKILL_LEVEL = 99;
export const MAX_COMBAT_LEVEL = 126;

export const MAX_TOTAL_XP = SKILLS.length * MAX_SKILL_XP;
export const MAX_TOTAL_LEVEL = SKILLS.length * MAX_SKILL_LEVEL;

export const COMBAT_SKILLS = [
  "Attack",
  "Strength",
  "Defence",
  "Hitpoints",
  "Ranged",
  "Prayer",
  "Magic",
] as const;
export const COMBAT_SKILLS_COUNT = COMBAT_SKILLS.length;

export const MAX_COMBAT_XP = COMBAT_SKILLS_COUNT * MAX_SKILL_XP;
