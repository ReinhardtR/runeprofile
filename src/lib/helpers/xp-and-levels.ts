import { Skill } from "~/lib/domain/profile-data-types";

const levels = [
  0, 83, 174, 276, 388, 512, 650, 801, 969, 1154, 1358, 1584, 1833, 2107, 2411,
  2746, 3115, 3523, 3973, 4470, 5018, 5624, 6291, 7028, 7842, 8740, 9730, 10824,
  12031, 13363, 14833, 16456, 18247, 20224, 22406, 24815, 27473, 30408, 33648,
  37224, 41171, 45529, 50339, 55649, 61512, 67983, 75127, 83014, 91721, 101333,
  111945, 123660, 136594, 150872, 166636, 184040, 203254, 224466, 247886,
  273742, 302288, 333804, 368599, 407015, 449428, 496254, 547953, 605032,
  668051, 737627, 814445, 899257, 992895, 1096278, 1210421, 1336443, 1475581,
  1629200, 1798808, 1986068, 2192818, 2421087, 2673114, 2951373, 3258594,
  3597792, 3972294, 4385776, 4842295, 5346332, 5902831, 6517253, 7195629,
  7944614, 8771558, 9684577, 10692629, 11805606, 13034431,
];

export const getLevelFromXP = (xp: number) => {
  for (let i = levels.length - 1; i >= 0; i--) {
    const level = levels[i];
    if (level && xp >= level) {
      return i + 1;
    }
  }

  return 1;
};

const virtualLevels = [
  ...levels,
  14391160,
  15889109,
  17542976,
  19368992,
  21385073,
  23611006,
  26068632,
  28782069,
  31777943,
  35085654,
  38737661,
  42769801,
  47221641,
  52136869,
  57563718,
  63555443,
  70170840,
  77474828,
  85539082,
  94442737,
  104273167,
  115126838,
  127110260,
  140341028,
  154948977,
  171077457,
  188884740,
  200000000,
];

export const getVirtualLevelFromXP = (xp: number) => {
  for (let i = virtualLevels.length - 1; i >= 0; i--) {
    const virtualLevel = virtualLevels[i];
    if (virtualLevel && xp >= virtualLevel) {
      return i + 1;
    }
  }

  return 1;
};

export const getXPUntilNextLevel = (xp: number) => {
  const level = getVirtualLevelFromXP(xp);
  const virtualLevel = virtualLevels[level];
  return virtualLevel ? virtualLevel - xp : 0;
};

type CombatSkills = {
  attack: number;
  strength: number;
  defence: number;
  hitpoints: number;
  ranged: number;
  prayer: number;
  magic: number;
};

export const getCombatLevel = ({
  attack = 1,
  strength = 1,
  defence = 1,
  hitpoints = 10,
  ranged = 1,
  prayer = 1,
  magic = 1,
}: CombatSkills) => {
  const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
  const melee = 0.325 * (attack + strength);
  const range = 0.325 * Math.floor(ranged / 2);
  const mage = 0.325 * Math.floor(magic / 2);
  return Math.floor(base + Math.max(melee, range, mage));
};

export const getCombatLevelFromSkills = (skills: Skill[]) => {
  return getCombatLevel({
    attack: getLevelFromXP(skills.find((s) => s.name === "Attack")?.xp ?? 0),
    strength: getLevelFromXP(
      skills.find((s) => s.name === "Strength")?.xp ?? 0
    ),
    defence: getLevelFromXP(skills.find((s) => s.name === "Defence")?.xp ?? 0),
    hitpoints: getLevelFromXP(
      skills.find((s) => s.name === "Hitpoints")?.xp ?? 1154 // Default to 10 HP
    ),
    ranged: getLevelFromXP(skills.find((s) => s.name === "Ranged")?.xp ?? 0),
    prayer: getLevelFromXP(skills.find((s) => s.name === "Prayer")?.xp ?? 0),
    magic: getLevelFromXP(skills.find((s) => s.name === "Magic")?.xp ?? 0),
  });
};
