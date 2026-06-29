import { COMBAT_SKILLS } from ".";

export const LEVELS_XP = [
  0, 83, 174, 276, 388, 512, 650, 801, 969, 1_154, 1_358, 1_584, 1_833, 2_107,
  2_411, 2_746, 3_115, 3_523, 3_973, 4_470, 5_018, 5_624, 6_291, 7_028, 7_842,
  8_740, 9_730, 10_824, 12_031, 13_363, 14_833, 16_456, 18_247, 20_224, 22_406,
  24_815, 27_473, 30_408, 33_648, 37_224, 41_171, 45_529, 50_339, 55_649,
  61_512, 67_983, 75_127, 83_014, 91_721, 101_333, 111_945, 123_660, 136_594,
  150_872, 166_636, 184_040, 203_254, 224_466, 247_886, 273_742, 302_288,
  333_804, 368_599, 407_015, 449_428, 496_254, 547_953, 605_032, 668_051,
  737_627, 814_445, 899_257, 992_895, 1_096_278, 1_210_421, 1_336_443,
  1_475_581, 1_629_200, 1_798_808, 1_986_068, 2_192_818, 2_421_087, 2_673_114,
  2_951_373, 3_258_594, 3_597_792, 3_972_294, 4_385_776, 4_842_295, 5_346_332,
  5_902_831, 6_517_253, 7_195_629, 7_944_614, 8_771_558, 9_684_577, 10_692_629,
  11_805_606, 13_034_431,
];

export const getLevelXpThreshold = (level: number) => {
  if (level < 1 || level > LEVELS_XP.length) {
    throw new Error(
      `Invalid level: ${level}. Must be between 1 and ${LEVELS_XP.length}.`,
    );
  }
  return LEVELS_XP[level - 1]!;
};

export const getLevelFromXP = (xp: number) => {
  for (let i = LEVELS_XP.length - 1; i >= 0; i--) {
    const level = LEVELS_XP[i];
    if (level && xp >= level) {
      return i + 1;
    }
  }

  return 1;
};

const virtualLevels = [
  ...LEVELS_XP,
  14_391_160,
  15_889_109,
  17_542_976,
  19_368_992,
  21_385_073,
  23_611_006,
  26_068_632,
  28_782_069,
  31_777_943,
  35_085_654,
  38_737_661,
  42_769_801,
  47_221_641,
  52_136_869,
  57_563_718,
  63_555_443,
  70_170_840,
  77_474_828,
  85_539_082,
  94_442_737,
  104_273_167,
  115_126_838,
  127_110_260,
  140_341_028,
  154_948_977,
  171_077_457,
  188_884_740,
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

export const getCombatXpFromSkills = (
  skills: { name: string; xp: number }[],
) => {
  return skills
    .filter((skill) => COMBAT_SKILLS.includes(skill.name as any))
    .reduce((total, skill) => total + skill.xp, 0);
};

export const getCombatLevelFromSkills = (
  skills: { name: string; xp: number }[],
) => {
  const getSkillXP = (name: string, defaultXP = 0) =>
    skills.find((s) => s.name === name)?.xp ?? defaultXP;

  return getCombatLevel({
    attack: getLevelFromXP(getSkillXP("Attack")),
    strength: getLevelFromXP(getSkillXP("Strength")),
    defence: getLevelFromXP(getSkillXP("Defence")),
    hitpoints: getLevelFromXP(getSkillXP("Hitpoints", 1154)), // Default to 10 HP
    ranged: getLevelFromXP(getSkillXP("Ranged")),
    prayer: getLevelFromXP(getSkillXP("Prayer")),
    magic: getLevelFromXP(getSkillXP("Magic")),
  });
};
