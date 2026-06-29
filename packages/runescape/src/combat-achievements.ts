import { isGroupIronman } from "./account-types";

// ids based on runescript:4784
export type CombatAchievementTier = {
  id: number;
  name: string;
};
export const COMBAT_ACHIEVEMENT_TIERS = [
  { id: 1, name: "Easy" },
  { id: 2, name: "Medium" },
  { id: 3, name: "Hard" },
  { id: 4, name: "Elite" },
  { id: 5, name: "Master" },
  { id: 6, name: "Grandmaster" },
] as const satisfies CombatAchievementTier[];

export type CombatAchievementTask = {
  index: number;
  tierId: number;
  name: string;
  description: string;
  type: CombatAchievementTaskType;
  monster: string;
};

export const COMBAT_ACHIEVEMENT_TASK_TYPES = [
  "Kill Count",
  "Mechanical",
  "Perfection",
  "Restriction",
  "Speed",
  "Stamina",
] as const;

export type CombatAchievementTaskType =
  (typeof COMBAT_ACHIEVEMENT_TASK_TYPES)[number];

// The VarPlayer IDs used to track individual combat achievement completion (bit-packed)
export const COMBAT_ACHIEVEMENT_VARPS = [
  3116, 3117, 3118, 3119, 3120, 3121, 3122, 3123, 3124, 3125, 3126, 3127, 3128,
  3387, 3718, 3773, 3774, 4204, 4496, 4721,
] as const;

// Points awarded per tier
const COMBAT_ACHIEVEMENT_TIER_POINTS: Record<number, number> = {
  1: 1, // Easy
  2: 2, // Medium
  3: 3, // Hard
  4: 4, // Elite
  5: 5, // Master
  6: 6, // Grandmaster
};

// Number of tasks excluded per tier for Group Ironman accounts
const GIM_EXCLUDED_TASKS: Partial<Record<number, number>> = {
  6: 1,
};

export function getCombatAchievementTierTaskCount(
  id: number,
  accountTypeId?: number,
) {
  const count = COMBAT_ACHIEVEMENT_TASKS.filter((t) => t.tierId === id).length;
  if (count === 0) return undefined;

  if (accountTypeId !== undefined && isGroupIronman(accountTypeId)) {
    const excluded = GIM_EXCLUDED_TASKS[id] ?? 0;
    return count - excluded;
  }

  return count;
}

export function getCombatAchievementTierName(id: number) {
  return COMBAT_ACHIEVEMENT_TIERS.find((tier) => tier.id === id)?.name;
}

/**
 * Decodes varp bitmaps into a list of completed task indices.
 * @param varps - Record of varp ID to raw 32-bit value
 * @returns Array of completed task indices
 */
export function decodeCombatAchievements(
  varps: Record<string, number>,
): number[] {
  const completed: number[] = [];
  const varpEntries = COMBAT_ACHIEVEMENT_VARPS.map((varpId, position) => ({
    varpId,
    position,
    value: varps[String(varpId)] ?? 0,
  }));

  for (const { position, value } of varpEntries) {
    if (value === 0) continue;
    for (let bit = 0; bit < 32; bit++) {
      if ((value >>> bit) & 1) {
        completed.push(position * 32 + bit);
      }
    }
  }

  return completed;
}

/**
 * Calculates total combat achievement points from completed task indices.
 */
export function calculateCombatAchievementPoints(
  completedIndices: number[],
): number {
  const taskMap = new Map(COMBAT_ACHIEVEMENT_TASKS.map((t) => [t.index, t]));
  let points = 0;
  for (const index of completedIndices) {
    const task = taskMap.get(index);
    if (task) {
      points += COMBAT_ACHIEVEMENT_TIER_POINTS[task.tierId] ?? 0;
    }
  }
  return points;
}

/**
 * Returns the highest tier ID where total points >= threshold, or null if none reached.
 */
export function getCombatAchievementTierReached(
  totalPoints: number,
): number | null {
  let reached: number | null = null;
  for (const threshold of COMBAT_ACHIEVEMENT_TIER_THRESHOLDS) {
    if (totalPoints >= threshold.points) {
      reached = threshold.id;
    }
  }
  return reached;
}

/**
 * Derives per-tier completed counts from a list of completed task indices.
 */
export function deriveCombatAchievementTierCounts(
  completedIndices: number[],
): Array<{ id: number; completedCount: number }> {
  const taskMap = new Map(COMBAT_ACHIEVEMENT_TASKS.map((t) => [t.index, t]));
  const counts: Record<number, number> = {};
  for (const tier of COMBAT_ACHIEVEMENT_TIERS) {
    counts[tier.id] = 0;
  }
  for (const index of completedIndices) {
    const task = taskMap.get(index);
    if (task) {
      counts[task.tierId] = (counts[task.tierId] ?? 0) + 1;
    }
  }
  return COMBAT_ACHIEVEMENT_TIERS.map((tier) => ({
    id: tier.id,
    completedCount: counts[tier.id] ?? 0,
  }));
}

/**
 * Estimates total combat achievement points from legacy per-tier completion counts.
 * This is an approximation since all tasks in a tier award the same points.
 */
export function legacy_calculateCombatAchievementPoints(
  tierCounts: Array<{ id: number; completedCount: number }>,
): number {
  let points = 0;
  for (const { id, completedCount } of tierCounts) {
    points += completedCount * (COMBAT_ACHIEVEMENT_TIER_POINTS[id] ?? 0);
  }
  return points;
}

// The curated list of bosses shown in the in-game Combat Achievements "Bosses" view.
// Derived from game cache enum_3987 (int -> struct) where param_1313 = boss name.
// Monsters not in this list (e.g. Aberrant Spectre, Hellhound) are regular slayer/quest monsters.
// prettier-ignore
export const COMBAT_ACHIEVEMENT_BOSSES = [
  'Abyssal Sire',
  'Alchemical Hydra',
  'Amoxliatl',
  'Araxxor',
  'Barrows',
  'Brutus',
  'Bryophyta',
  'Callisto',
  'Cerberus',
  'Chambers of Xeric',
  'Chambers of Xeric: CM',
  'Chaos Elemental',
  'Chaos Fanatic',
  'Commander Zilyana',
  'Corporeal Beast',
  'Corrupted Hunllef',
  'Crazy Archaeologist',
  'Crystalline Hunllef',
  'Dagannoth Prime',
  'Dagannoth Rex',
  'Dagannoth Supreme',
  'Deranged Archaeologist',
  'Doom of Mokhaiotl',
  'Duke Sucellus',
  'Fortis Colosseum',
  'General Graardor',
  'Giant Mole',
  'Grotesque Guardians',
  'Hespori',
  'Kalphite Queen',
  'King Black Dragon',
  'Kraken',
  "Kree'arra",
  "K'ril Tsutsaroth",
  'Mimic',
  'Moons of Peril',
  'Nex',
  'Obor',
  'Phantom Muspah',
  "Phosani's Nightmare",
  'Royal Titans',
  'Sarachnis',
  'Scorpia',
  'Scurrius',
  'Shellbane Gryphon',
  'Skotizo',
  'Tempoross',
  'The Hueycoatl',
  'The Leviathan',
  'The Nightmare',
  'The Whisperer',
  'Theatre of Blood',
  'Theatre of Blood: Entry Mode',
  'Theatre of Blood: Hard Mode',
  'Thermonuclear Smoke Devil',
  'Tombs of Amascut',
  'Tombs of Amascut: Entry Mode',
  'Tombs of Amascut: Expert Mode',
  "TzHaar-Ket-Rak's Challenges",
  'TzKal-Zuk',
  'TzTok-Jad',
  'Vardorvis',
  'Venenatis',
  "Vet'ion",
  'Vorkath',
  'Wintertodt',
  'Yama',
  'Zalcano',
  'Zulrah',
] as const;

/**
 * Maps collection log page names to CA boss names where they don't match directly.
 * Most collection log pages match their CA boss name exactly — only mismatches are listed here.
 */
export const COLLECTION_LOG_TO_CA_BOSS_MAP: Record<string, string> = {
  "Barrows Chests": "Barrows",
  "Callisto and Artio": "Callisto",
  "Dagannoth Kings": "Dagannoth Rex",
  "The Fight Caves": "TzTok-Jad",
  "The Gauntlet": "Crystalline Hunllef",
  "The Inferno": "TzKal-Zuk",
  "Venenatis and Spindel": "Venenatis",
  "Vet'ion and Calvar'ion": "Vet'ion",
};

/**
 * Maps CA boss names to hiscore icon keys where the names don't match directly.
 * Most CA bosses match their hiscore key exactly — only mismatches are listed here.
 * Manually maintained (not scraped).
 */
export const COMBAT_ACHIEVEMENT_BOSS_HISCORE_ICON_MAP: Record<string, string> =
  {
    Barrows: "Barrows Chests",
    "Chambers of Xeric: CM": "Chambers of Xeric: Challenge Mode",
    "Corrupted Hunllef": "The Corrupted Gauntlet",
    "Crystalline Hunllef": "The Gauntlet",
    "Fortis Colosseum": "Sol Heredit",
    "Kree'arra": "Kree'Arra",
    "Moons of Peril": "Lunar Chests",
    "Royal Titans": "The Royal Titans",
    "The Nightmare": "Nightmare",
    "Theatre of Blood: Entry Mode": "Theatre of Blood",
  };

// prettier-ignore
export const COMBAT_ACHIEVEMENT_TASKS: CombatAchievementTask[] = [
  { index: 0, tierId: 1, name: 'Noxious Foe', description: 'Kill an Aberrant Spectre.', type: 'Kill Count', monster: 'Aberrant Spectre' },
  { index: 1, tierId: 3, name: 'Abyssal Adept', description: 'Kill the Abyssal Sire 20 times.', type: 'Kill Count', monster: 'Abyssal Sire' },
  { index: 2, tierId: 4, name: 'Abyssal Veteran', description: 'Kill the Abyssal Sire 50 times.', type: 'Kill Count', monster: 'Abyssal Sire' },
  { index: 3, tierId: 3, name: 'They Grow Up Too Fast', description: 'Kill the Abyssal Sire without letting any Scion mature.', type: 'Mechanical', monster: 'Abyssal Sire' },
  { index: 4, tierId: 4, name: 'Respiratory Runner', description: 'Kill the Abyssal Sire after only stunning him once.', type: 'Mechanical', monster: 'Abyssal Sire' },
  { index: 5, tierId: 3, name: 'Don\'t Whip Me', description: 'Kill the Abyssal Sire without being hit by any external tentacles.', type: 'Mechanical', monster: 'Abyssal Sire' },
  { index: 6, tierId: 4, name: 'Demonic Rebound', description: 'Use the Vengeance spell to reflect the damage from the Abyssal Sire\'s explosion back to him.', type: 'Mechanical', monster: 'Abyssal Sire' },
  { index: 7, tierId: 3, name: 'Don\'t Stop Moving', description: 'Kill the Abyssal Sire without taking damage from any miasma pools.', type: 'Perfection', monster: 'Abyssal Sire' },
  { index: 8, tierId: 4, name: 'Perfect Sire', description: 'Kill the Abyssal Sire without taking damage from the external tentacles, miasma pools, explosion or damage from the Abyssal Sire without praying the appropriate protection prayer.', type: 'Perfection', monster: 'Abyssal Sire' },
  { index: 9, tierId: 3, name: 'Kree\'arra Adept', description: 'Kill Kree\'arra 50 times.', type: 'Kill Count', monster: 'Kree\'arra' },
  { index: 10, tierId: 4, name: 'Kree\'arra Veteran', description: 'Kill Kree\'arra 100 times.', type: 'Kill Count', monster: 'Kree\'arra' },
  { index: 11, tierId: 5, name: 'Collateral Damage', description: 'Kill Kree\'arra in a privately rented instance without ever attacking him directly.', type: 'Mechanical', monster: 'Kree\'arra' },
  { index: 12, tierId: 3, name: 'Airborne Showdown', description: 'Finish off Kree\'arra whilst all of his bodyguards are dead.', type: 'Mechanical', monster: 'Kree\'arra' },
  { index: 13, tierId: 5, name: 'Swoop No More', description: 'Kill Kree\'arra in a privately rented instance without taking any melee damage from the boss or his bodyguards.', type: 'Perfection', monster: 'Kree\'arra' },
  { index: 14, tierId: 6, name: 'The Worst Ranged Weapon', description: 'Kill Kree\'arra by only dealing damage to him with a salamander.', type: 'Restriction', monster: 'Kree\'arra' },
  { index: 15, tierId: 6, name: 'Feather Hunter', description: 'Kill Kree\'arra 30 times in a privately rented instance without leaving the room.', type: 'Stamina', monster: 'Kree\'arra' },
  { index: 16, tierId: 3, name: 'General Graardor Adept', description: 'Kill General Graardor 50 times.', type: 'Kill Count', monster: 'General Graardor' },
  { index: 17, tierId: 4, name: 'General Graardor Veteran', description: 'Kill General Graardor 100 times.', type: 'Kill Count', monster: 'General Graardor' },
  { index: 18, tierId: 3, name: 'Ourg Freezer', description: 'Kill General Graardor whilst he is immobilized.', type: 'Mechanical', monster: 'General Graardor' },
  { index: 19, tierId: 4, name: 'Ourg Freezer II', description: 'Kill General Graardor without him attacking any players.', type: 'Mechanical', monster: 'General Graardor' },
  { index: 20, tierId: 3, name: 'General Showdown', description: 'Finish off General Graardor whilst all of his bodyguards are dead.', type: 'Mechanical', monster: 'General Graardor' },
  { index: 21, tierId: 6, name: 'Defence Matters', description: 'Kill General Graardor 2 times consecutively in a privately rented instance without taking any damage from his bodyguards.', type: 'Perfection', monster: 'General Graardor' },
  { index: 22, tierId: 6, name: 'Keep Away', description: 'Kill General Graardor in a privately rented instance without taking any damage from the boss or bodyguards.', type: 'Perfection', monster: 'General Graardor' },
  { index: 23, tierId: 6, name: 'Ourg Killer', description: 'Kill General Graardor 15 times in a privately rented instance without leaving the room.', type: 'Stamina', monster: 'General Graardor' },
  { index: 24, tierId: 1, name: 'Barrows Novice', description: 'Open the Barrows chest 10 times.', type: 'Kill Count', monster: 'Barrows' },
  { index: 25, tierId: 2, name: 'Barrows Champion', description: 'Open the Barrows chest 25 times.', type: 'Kill Count', monster: 'Barrows' },
  { index: 26, tierId: 2, name: 'Can\'t Touch Me', description: 'Kill Dharok, Verac, Torag and Guthan without letting them attack you with melee.', type: 'Mechanical', monster: 'Barrows' },
  { index: 27, tierId: 2, name: 'Pray for Success', description: 'Kill all six Barrows Brothers and loot the Barrows chest without taking any damage from any of the brothers.', type: 'Perfection', monster: 'Barrows' },
  { index: 28, tierId: 1, name: 'Defence? What Defence?', description: 'Kill any Barrows Brother using only magical damage.', type: 'Restriction', monster: 'Barrows' },
  { index: 29, tierId: 3, name: 'Just Like That', description: 'Kill Karil using only damage dealt by special attacks.', type: 'Restriction', monster: 'Barrows' },
  { index: 30, tierId: 3, name: 'Faithless Crypt Run', description: 'Kill all six Barrows Brothers and loot the Barrows chest without ever having more than 0 prayer points.', type: 'Restriction', monster: 'Barrows' },
  { index: 31, tierId: 4, name: 'Reflecting on This Encounter', description: 'Kill a Basilisk Knight.', type: 'Kill Count', monster: 'Basilisk Knight' },
  { index: 32, tierId: 1, name: 'Big, Black and Fiery', description: 'Kill a Black Dragon.', type: 'Kill Count', monster: 'Black Dragon' },
  { index: 33, tierId: 1, name: 'The Demonic Punching Bag', description: 'Kill a Bloodveld.', type: 'Kill Count', monster: 'Bloodveld' },
  { index: 34, tierId: 2, name: 'Brutal, Big, Black and Firey', description: 'Kill a Brutal Black Dragon.', type: 'Kill Count', monster: 'Brutal Black Dragon' },
  { index: 35, tierId: 1, name: 'Bryophyta Novice', description: 'Open Bryophyta\'s chest once.', type: 'Kill Count', monster: 'Bryophyta' },
  { index: 36, tierId: 2, name: 'Bryophyta Champion', description: 'Open Bryophyta\'s chest 5 times.', type: 'Kill Count', monster: 'Bryophyta' },
  { index: 37, tierId: 1, name: 'Protection from Moss', description: 'Kill Bryophyta with the Protect from Magic prayer active.', type: 'Mechanical', monster: 'Bryophyta' },
  { index: 38, tierId: 2, name: 'Quick Cutter', description: 'Kill all 3 of Bryophyta\'s growthlings within 3 seconds of the first one dying.', type: 'Mechanical', monster: 'Bryophyta' },
  { index: 39, tierId: 1, name: 'Preparation Is Key', description: 'Kill Bryophyta without suffering any poison damage.', type: 'Perfection', monster: 'Bryophyta' },
  { index: 40, tierId: 1, name: 'A Slow Death', description: 'Kill Bryophyta with either poison or venom being the final source of damage.', type: 'Restriction', monster: 'Bryophyta' },
  { index: 41, tierId: 1, name: 'Fighting as Intended II', description: 'Kill Bryophyta on a free to play world.', type: 'Restriction', monster: 'Bryophyta' },
  { index: 42, tierId: 3, name: 'Callisto Adept', description: 'Kill Callisto 10 times.', type: 'Kill Count', monster: 'Callisto' },
  { index: 43, tierId: 4, name: 'Callisto Veteran', description: 'Kill Callisto 20 times.', type: 'Kill Count', monster: 'Callisto' },
  { index: 44, tierId: 2, name: 'Skotizo Champion', description: 'Kill Skotizo once.', type: 'Kill Count', monster: 'Skotizo' },
  { index: 45, tierId: 3, name: 'Skotizo Adept', description: 'Kill Skotizo 5 times.', type: 'Kill Count', monster: 'Skotizo' },
  { index: 46, tierId: 2, name: 'Demonic Weakening', description: 'Kill Skotizo with no altars active.', type: 'Mechanical', monster: 'Skotizo' },
  { index: 47, tierId: 4, name: 'Demon Evasion', description: 'Kill Skotizo without taking any damage.', type: 'Perfection', monster: 'Skotizo' },
  { index: 48, tierId: 2, name: 'Demonbane Weaponry', description: 'Kill Skotizo with a demonbane weapon equipped.', type: 'Restriction', monster: 'Skotizo' },
  { index: 49, tierId: 4, name: 'Up for the Challenge', description: 'Kill Skotizo without equipping a demonbane weapon.', type: 'Restriction', monster: 'Skotizo' },
  { index: 50, tierId: 5, name: 'Precise Positioning', description: 'Kill Skotizo with the final source of damage being a Chinchompa explosion.', type: 'Restriction', monster: 'Skotizo' },
  { index: 51, tierId: 4, name: 'Cerberus Veteran', description: 'Kill Cerberus 75 times.', type: 'Kill Count', monster: 'Cerberus' },
  { index: 52, tierId: 5, name: 'Cerberus Master', description: 'Kill Cerberus 150 times.', type: 'Kill Count', monster: 'Cerberus' },
  { index: 53, tierId: 5, name: 'Arooo No More', description: 'Kill Cerberus without any of the Summoned Souls being spawned.', type: 'Mechanical', monster: 'Cerberus' },
  { index: 54, tierId: 4, name: 'Ghost Buster', description: 'Kill Cerberus after successfully negating 6 or more attacks from Summoned Souls.', type: 'Mechanical', monster: 'Cerberus' },
  { index: 55, tierId: 4, name: 'Unrequired Antifire', description: 'Kill Cerberus without taking damage from any lava pools.', type: 'Perfection', monster: 'Cerberus' },
  { index: 56, tierId: 4, name: 'Anti-Bite Mechanics', description: 'Kill Cerberus without taking any melee damage.', type: 'Perfection', monster: 'Cerberus' },
  { index: 57, tierId: 3, name: 'Chaos Elemental Adept', description: 'Kill the Chaos Elemental 10 times.', type: 'Kill Count', monster: 'Chaos Elemental' },
  { index: 58, tierId: 4, name: 'Chaos Elemental Veteran', description: 'Kill the Chaos Elemental 25 times.', type: 'Kill Count', monster: 'Chaos Elemental' },
  { index: 59, tierId: 3, name: 'Hoarder', description: 'Kill the Chaos Elemental without it unequipping any of your items.', type: 'Mechanical', monster: 'Chaos Elemental' },
  { index: 60, tierId: 3, name: 'The Flincher', description: 'Kill the Chaos Elemental without taking any damage from its attacks.', type: 'Perfection', monster: 'Chaos Elemental' },
  { index: 61, tierId: 2, name: 'Chaos Fanatic Champion', description: 'Kill the Chaos Fanatic 10 times.', type: 'Kill Count', monster: 'Chaos Fanatic' },
  { index: 62, tierId: 3, name: 'Chaos Fanatic Adept', description: 'Kill the Chaos Fanatic 25 times.', type: 'Kill Count', monster: 'Chaos Fanatic' },
  { index: 63, tierId: 2, name: 'Sorry, What Was That?', description: 'Kill the Chaos Fanatic without anyone being hit by his explosion attack.', type: 'Perfection', monster: 'Chaos Fanatic' },
  { index: 64, tierId: 3, name: 'Praying to the Gods', description: 'Kill the Chaos Fanatic 10 times without drinking any potion which restores prayer or leaving the Wilderness.', type: 'Restriction', monster: 'Chaos Fanatic' },
  { index: 65, tierId: 4, name: 'Corporeal Beast Veteran', description: 'Kill the Corporeal Beast 25 times.', type: 'Kill Count', monster: 'Corporeal Beast' },
  { index: 66, tierId: 5, name: 'Corporeal Beast Master', description: 'Kill the Corporeal Beast 50 times.', type: 'Kill Count', monster: 'Corporeal Beast' },
  { index: 67, tierId: 4, name: 'Hot on Your Feet', description: 'Kill the Corporeal Beast without anyone killing the dark core or taking damage from the dark core.', type: 'Perfection', monster: 'Corporeal Beast' },
  { index: 68, tierId: 4, name: 'Finding the Weak Spot', description: 'Finish off the Corporeal Beast with a Halberd special attack.', type: 'Restriction', monster: 'Corporeal Beast' },
  { index: 69, tierId: 4, name: 'Chicken Killer', description: 'Kill the Corporeal Beast solo.', type: 'Restriction', monster: 'Corporeal Beast' },
  { index: 70, tierId: 2, name: 'Crazy Archaeologist Champion', description: 'Kill the Crazy Archaeologist 10 times.', type: 'Kill Count', monster: 'Crazy Archaeologist' },
  { index: 71, tierId: 3, name: 'Crazy Archaeologist Adept', description: 'Kill the Crazy Archaeologist 25 times.', type: 'Kill Count', monster: 'Crazy Archaeologist' },
  { index: 72, tierId: 2, name: 'Mage of the Ruins', description: 'Kill the Crazy Archaeologist with only magical attacks.', type: 'Mechanical', monster: 'Crazy Archaeologist' },
  { index: 73, tierId: 2, name: 'I\'d Rather Not Learn', description: 'Kill the Crazy Archaeologist without anyone being hit by his "Rain of Knowledge" attack.', type: 'Perfection', monster: 'Crazy Archaeologist' },
  { index: 74, tierId: 4, name: 'If Gorillas Could Fly', description: 'Kill a Demonic Gorilla.', type: 'Kill Count', monster: 'Demonic Gorilla' },
  { index: 75, tierId: 4, name: 'Hitting Them Where It Hurts', description: 'Finish off a Demonic Gorilla with a demonbane weapon.', type: 'Restriction', monster: 'Demonic Gorilla' },
  { index: 76, tierId: 1, name: 'Deranged Archaeologist Novice', description: 'Kill the Deranged Archaeologist 10 times.', type: 'Kill Count', monster: 'Deranged Archaeologist' },
  { index: 77, tierId: 2, name: 'Deranged Archaeologist Champion', description: 'Kill the Deranged Archaeologist 25 times.', type: 'Kill Count', monster: 'Deranged Archaeologist' },
  { index: 78, tierId: 2, name: 'Mage of the Swamp', description: 'Kill the Deranged Archaeologist with only magical attacks.', type: 'Mechanical', monster: 'Deranged Archaeologist' },
  { index: 79, tierId: 2, name: 'I\'d Rather Be Illiterate', description: 'Kill the Deranged Archaeologist without anyone being hit by his "Learn to Read" attack.', type: 'Perfection', monster: 'Deranged Archaeologist' },
  { index: 80, tierId: 1, name: 'The Walking Volcano', description: 'Kill a Fire Giant.', type: 'Kill Count', monster: 'Fire Giant' },
  { index: 81, tierId: 4, name: 'Galvek Speed-Trialist', description: 'Kill Galvek in less than 3 minutes.', type: 'Speed', monster: 'Galvek' },
  { index: 82, tierId: 3, name: 'Grotesque Guardians Adept', description: 'Kill the Grotesque Guardians 25 times.', type: 'Kill Count', monster: 'Grotesque Guardians' },
  { index: 83, tierId: 4, name: 'Grotesque Guardians Veteran', description: 'Kill the Grotesque Guardians 50 times.', type: 'Kill Count', monster: 'Grotesque Guardians' },
  { index: 84, tierId: 3, name: 'Don\'t Look at the Eclipse', description: 'Kill the Grotesque Guardians without taking damage from Dusk\'s blinding attack.', type: 'Mechanical', monster: 'Grotesque Guardians' },
  { index: 85, tierId: 3, name: 'Prison Break', description: 'Kill the Grotesque Guardians without taking damage from Dusk\'s prison attack.', type: 'Mechanical', monster: 'Grotesque Guardians' },
  { index: 86, tierId: 3, name: 'Granite Footwork', description: 'Kill the Grotesque Guardians without taking damage from Dawn\'s rockfall attack.', type: 'Mechanical', monster: 'Grotesque Guardians' },
  { index: 87, tierId: 3, name: 'Heal No More', description: 'Kill the Grotesque Guardians without letting Dawn receive any healing from her orbs.', type: 'Mechanical', monster: 'Grotesque Guardians' },
  { index: 88, tierId: 3, name: 'Static Awareness', description: 'Kill the Grotesque Guardians without being hit by any lightning attacks.', type: 'Mechanical', monster: 'Grotesque Guardians' },
  { index: 89, tierId: 4, name: 'Done before Dusk', description: 'Kill the Grotesque Guardians before Dusk uses his prison attack for a second time.', type: 'Mechanical', monster: 'Grotesque Guardians' },
  { index: 90, tierId: 4, name: 'Perfect Grotesque Guardians', description: 'Kill the Grotesque Guardians whilst completing the "Don\'t look at the eclipse", "Prison Break", "Granite footwork", "Heal no more", "Static Awareness" and "Done before dusk" tasks.', type: 'Perfection', monster: 'Grotesque Guardians' },
  { index: 91, tierId: 5, name: 'Perfect Grotesque Guardians II', description: 'Kill the Grotesque Guardians 5 times in a row without leaving the instance, whilst completing the Perfect Grotesque Guardians task every time.', type: 'Perfection', monster: 'Grotesque Guardians' },
  { index: 92, tierId: 4, name: 'Grotesque Guardians Speed-Trialist', description: 'Kill the Grotesque Guardians in less than 2 minutes.', type: 'Speed', monster: 'Grotesque Guardians' },
  { index: 93, tierId: 5, name: 'Grotesque Guardians Speed-Chaser', description: 'Kill the Grotesque Guardians in less than 1:40 minutes.', type: 'Speed', monster: 'Grotesque Guardians' },
  { index: 94, tierId: 6, name: 'Grotesque Guardians Speed-Runner', description: 'Kill the Grotesque Guardians in less than 1:20 minutes.', type: 'Speed', monster: 'Grotesque Guardians' },
  { index: 95, tierId: 4, name: 'From Dusk...', description: 'Kill the Grotesque Guardians 10 times without leaving the instance.', type: 'Stamina', monster: 'Grotesque Guardians' },
  { index: 96, tierId: 5, name: '... \'til Dawn', description: 'Kill the Grotesque Guardians 20 times without leaving the instance.', type: 'Stamina', monster: 'Grotesque Guardians' },
  { index: 97, tierId: 2, name: 'A Smashing Time', description: 'Kill a Gargoyle.', type: 'Kill Count', monster: 'Gargoyle' },
  { index: 98, tierId: 4, name: 'Corrupted Gauntlet Veteran', description: 'Complete the Corrupted Gauntlet 5 times.', type: 'Kill Count', monster: 'Corrupted Hunllef' },
  { index: 99, tierId: 5, name: 'Corrupted Gauntlet Master', description: 'Complete the Corrupted Gauntlet 10 times.', type: 'Kill Count', monster: 'Corrupted Hunllef' },
  { index: 100, tierId: 6, name: 'Corrupted Gauntlet Grandmaster', description: 'Complete the Corrupted Gauntlet 50 times.', type: 'Kill Count', monster: 'Corrupted Hunllef' },
  { index: 101, tierId: 4, name: '3, 2, 1 - Mage', description: 'Kill the Corrupted Hunllef without taking damage off prayer.', type: 'Perfection', monster: 'Corrupted Hunllef' },
  { index: 102, tierId: 5, name: 'Perfect Corrupted Hunllef', description: 'Kill the Corrupted Hunllef without taking damage from: Tornadoes, Damaging Floor or Stomp Attacks. Also, do not take damage off prayer and do not attack the Corrupted Hunllef with the wrong weapon.', type: 'Perfection', monster: 'Corrupted Hunllef' },
  { index: 103, tierId: 5, name: 'Defence Doesn\'t Matter II', description: 'Kill the Corrupted Hunllef without making any armour within the Corrupted Gauntlet.', type: 'Restriction', monster: 'Corrupted Hunllef' },
  { index: 104, tierId: 6, name: 'Egniol Diet II', description: 'Kill the Corrupted Hunllef without making an egniol potion within the Corrupted Gauntlet.', type: 'Restriction', monster: 'Corrupted Hunllef' },
  { index: 105, tierId: 5, name: 'Corrupted Warrior', description: 'Kill the Corrupted Hunllef with a full set of perfected corrupted armour equipped.', type: 'Restriction', monster: 'Corrupted Hunllef' },
  { index: 106, tierId: 6, name: 'Wolf Puncher II', description: 'Kill the Corrupted Hunllef without making more than one attuned weapon.', type: 'Restriction', monster: 'Corrupted Hunllef' },
  { index: 107, tierId: 5, name: 'Corrupted Gauntlet Speed-Chaser', description: 'Complete a Corrupted Gauntlet in less than 7 minutes and 30 seconds.', type: 'Speed', monster: 'Corrupted Hunllef' },
  { index: 108, tierId: 6, name: 'Corrupted Gauntlet Speed-Runner', description: 'Complete a Corrupted Gauntlet in less than 6 minutes and 30 seconds.', type: 'Speed', monster: 'Corrupted Hunllef' },
  { index: 109, tierId: 4, name: 'Gauntlet Veteran', description: 'Complete the Gauntlet 5 times.', type: 'Kill Count', monster: 'Crystalline Hunllef' },
  { index: 110, tierId: 5, name: 'Gauntlet Master', description: 'Complete the Gauntlet 20 times.', type: 'Kill Count', monster: 'Crystalline Hunllef' },
  { index: 111, tierId: 4, name: '3, 2, 1 - Range', description: 'Kill the Crystalline Hunllef without taking damage off prayer.', type: 'Perfection', monster: 'Crystalline Hunllef' },
  { index: 112, tierId: 5, name: 'Perfect Crystalline Hunllef', description: 'Kill the Crystalline Hunllef without taking damage from: Tornadoes, Damaging Floor or Stomp Attacks. Also, do not take damage off prayer and do not attack the Crystalline Hunllef with the wrong weapon.', type: 'Perfection', monster: 'Crystalline Hunllef' },
  { index: 113, tierId: 5, name: 'Defence Doesn\'t Matter', description: 'Kill the Crystalline Hunllef without making any armour within the Gauntlet.', type: 'Restriction', monster: 'Crystalline Hunllef' },
  { index: 114, tierId: 4, name: 'Egniol Diet', description: 'Kill the Crystalline Hunllef without making an egniol potion within the Gauntlet.', type: 'Restriction', monster: 'Crystalline Hunllef' },
  { index: 115, tierId: 4, name: 'Crystalline Warrior', description: 'Kill the Crystalline Hunllef with a full set of perfected armour equipped.', type: 'Restriction', monster: 'Crystalline Hunllef' },
  { index: 116, tierId: 4, name: 'Wolf Puncher', description: 'Kill the Crystalline Hunllef without making more than one attuned weapon.', type: 'Restriction', monster: 'Crystalline Hunllef' },
  { index: 117, tierId: 5, name: 'Gauntlet Speed-Chaser', description: 'Complete the Gauntlet in less than 5 minutes.', type: 'Speed', monster: 'Crystalline Hunllef' },
  { index: 118, tierId: 6, name: 'Gauntlet Speed-Runner', description: 'Complete the Gauntlet in less than 4 minutes.', type: 'Speed', monster: 'Crystalline Hunllef' },
  { index: 119, tierId: 4, name: 'Glough Speed-Trialist', description: 'Kill Glough in less than 2 minutes and 30 seconds.', type: 'Speed', monster: 'Glough' },
  { index: 120, tierId: 1, name: 'A Greater Foe', description: 'Kill a Greater Demon.', type: 'Kill Count', monster: 'Greater Demon' },
  { index: 121, tierId: 1, name: 'Not So Great After All', description: 'Finish off a Greater Demon with a demonbane weapon.', type: 'Restriction', monster: 'Greater Demon' },
  { index: 122, tierId: 1, name: 'A Demon\'s Best Friend', description: 'Kill a Hellhound.', type: 'Kill Count', monster: 'Hellhound' },
  { index: 123, tierId: 3, name: 'Hespori Adept', description: 'Kill Hespori 5 times.', type: 'Kill Count', monster: 'Hespori' },
  { index: 124, tierId: 3, name: 'Hesporisn\'t', description: 'Finish off Hespori with a special attack.', type: 'Mechanical', monster: 'Hespori' },
  { index: 125, tierId: 3, name: 'Weed Whacker', description: 'Kill all of Hesporis flowers within 5 seconds.', type: 'Mechanical', monster: 'Hespori' },
  { index: 126, tierId: 4, name: 'Plant-Based Diet', description: 'Kill Hespori without losing any prayer points.', type: 'Restriction', monster: 'Hespori' },
  { index: 127, tierId: 4, name: 'Hespori Speed-Trialist', description: 'Kill the Hespori in less than 48 seconds.', type: 'Speed', monster: 'Hespori' },
  { index: 128, tierId: 5, name: 'Hespori Speed-Chaser', description: 'Kill the Hespori in less than 36 seconds.', type: 'Speed', monster: 'Hespori' },
  { index: 129, tierId: 1, name: 'Obor Novice', description: 'Open Obor\'s chest once.', type: 'Kill Count', monster: 'Obor' },
  { index: 130, tierId: 2, name: 'Obor Champion', description: 'Open Obor\'s chest 5 times.', type: 'Kill Count', monster: 'Obor' },
  { index: 131, tierId: 1, name: 'Sleeping Giant', description: 'Kill Obor whilst he is immobilized.', type: 'Mechanical', monster: 'Obor' },
  { index: 132, tierId: 2, name: 'Back to the Wall', description: 'Kill Obor without being pushed back more than one square by his knockback attack.', type: 'Mechanical', monster: 'Obor' },
  { index: 133, tierId: 2, name: 'Squashing the Giant', description: 'Kill Obor without taking any damage off prayer.', type: 'Perfection', monster: 'Obor' },
  { index: 134, tierId: 1, name: 'Fighting as Intended', description: 'Kill Obor on a free to play world.', type: 'Restriction', monster: 'Obor' },
  { index: 135, tierId: 4, name: 'Alchemical Veteran', description: 'Kill the Alchemical Hydra 75 times.', type: 'Kill Count', monster: 'Alchemical Hydra' },
  { index: 136, tierId: 5, name: 'Alchemical Master', description: 'Kill the Alchemical Hydra 150 times.', type: 'Kill Count', monster: 'Alchemical Hydra' },
  { index: 137, tierId: 5, name: 'Unrequired Antipoisons', description: 'Kill the Alchemical Hydra without being hit by the acid pool attack.', type: 'Mechanical', monster: 'Alchemical Hydra' },
  { index: 138, tierId: 5, name: 'Lightning Lure', description: 'Kill the Alchemical Hydra without being hit by the lightning attack.', type: 'Mechanical', monster: 'Alchemical Hydra' },
  { index: 139, tierId: 5, name: 'Don\'t Flame Me', description: 'Kill the Alchemical Hydra without being hit by the flame wall attack.', type: 'Mechanical', monster: 'Alchemical Hydra' },
  { index: 140, tierId: 5, name: 'Mixing Correctly', description: 'Kill the Alchemical Hydra without empowering it.', type: 'Mechanical', monster: 'Alchemical Hydra' },
  { index: 141, tierId: 5, name: 'The Flame Skipper', description: 'Kill the Alchemical Hydra without letting it spawn a flame wall attack.', type: 'Mechanical', monster: 'Alchemical Hydra' },
  { index: 142, tierId: 5, name: 'Alcleanical Hydra', description: 'Kill the Alchemical Hydra without taking any damage.', type: 'Perfection', monster: 'Alchemical Hydra' },
  { index: 143, tierId: 6, name: 'No Pressure', description: 'Kill the Alchemical Hydra using only Dharok\'s Greataxe as a weapon whilst having no more than 10 Hitpoints throughout the entire fight.', type: 'Restriction', monster: 'Alchemical Hydra' },
  { index: 144, tierId: 5, name: 'Alchemical Speed-Chaser', description: 'Kill the Alchemical Hydra in less than 1 minute 45 seconds.', type: 'Speed', monster: 'Alchemical Hydra' },
  { index: 145, tierId: 6, name: 'Alchemical Speed-Runner', description: 'Kill the Alchemical Hydra in less than 1 minute 20 seconds.', type: 'Speed', monster: 'Alchemical Hydra' },
  { index: 146, tierId: 5, name: 'Working Overtime', description: 'Kill the Alchemical Hydra 15 times without leaving the room.', type: 'Stamina', monster: 'Alchemical Hydra' },
  { index: 147, tierId: 4, name: 'Fight Caves Veteran', description: 'Complete the Fight Caves once.', type: 'Kill Count', monster: 'TzTok-Jad' },
  { index: 148, tierId: 5, name: 'Fight Caves Master', description: 'Complete the Fight Caves 5 times.', type: 'Kill Count', monster: 'TzTok-Jad' },
  { index: 149, tierId: 4, name: 'A Near Miss!', description: 'Complete the Fight Caves after surviving a hit from TzTok-Jad without praying.', type: 'Mechanical', monster: 'TzTok-Jad' },
  { index: 150, tierId: 5, name: 'Denying the Healers', description: 'Complete the Fight caves without letting any of the Yt-MejKot heal.', type: 'Mechanical', monster: 'TzTok-Jad' },
  { index: 151, tierId: 6, name: 'Denying the Healers II', description: 'Complete the Fight Caves without TzTok-Jad being healed by a Yt-HurKot.', type: 'Mechanical', monster: 'TzTok-Jad' },
  { index: 152, tierId: 5, name: 'You Didn\'t Say Anything About a Bat', description: 'Complete the Fight Caves without being attacked by a Tz-Kih.', type: 'Mechanical', monster: 'TzTok-Jad' },
  { index: 153, tierId: 4, name: 'Facing Jad Head-on', description: 'Complete the Fight Caves with only melee.', type: 'Restriction', monster: 'TzTok-Jad' },
  { index: 154, tierId: 6, name: 'No Time for a Drink', description: 'Complete the Fight Caves without losing any prayer points.', type: 'Restriction', monster: 'TzTok-Jad' },
  { index: 155, tierId: 5, name: 'Fight Caves Speed-Chaser', description: 'Complete the Fight Caves in less than 30 minutes.', type: 'Speed', monster: 'TzTok-Jad' },
  { index: 156, tierId: 6, name: 'Fight Caves Speed-Runner', description: 'Complete the Fight Caves in less than 26 minutes and 30 seconds.', type: 'Speed', monster: 'TzTok-Jad' },
  { index: 157, tierId: 3, name: 'Kalphite Queen Adept', description: 'Kill the Kalphite Queen 25 times.', type: 'Kill Count', monster: 'Kalphite Queen' },
  { index: 158, tierId: 4, name: 'Kalphite Queen Veteran', description: 'Kill the Kalphite Queen 50 times.', type: 'Kill Count', monster: 'Kalphite Queen' },
  { index: 159, tierId: 3, name: 'Chitin Penetrator', description: 'Kill the Kalphite Queen while her defence was last lowered by you.', type: 'Mechanical', monster: 'Kalphite Queen' },
  { index: 160, tierId: 4, name: 'Insect Deflection', description: 'Kill the Kalphite Queen by using the Vengeance spell as the finishing blow.', type: 'Mechanical', monster: 'Kalphite Queen' },
  { index: 161, tierId: 4, name: 'Prayer Smasher', description: 'Kill the Kalphite Queen using only the Verac\'s Flail as a weapon.', type: 'Restriction', monster: 'Kalphite Queen' },
  { index: 162, tierId: 1, name: 'King Black Dragon Novice', description: 'Kill the King Black Dragon 10 times.', type: 'Kill Count', monster: 'King Black Dragon' },
  { index: 163, tierId: 2, name: 'King Black Dragon Champion', description: 'Kill the King Black Dragon 25 times.', type: 'Kill Count', monster: 'King Black Dragon' },
  { index: 164, tierId: 2, name: 'Claw Clipper', description: 'Kill the King Black Dragon with the Protect from Melee prayer activated.', type: 'Mechanical', monster: 'King Black Dragon' },
  { index: 165, tierId: 2, name: 'Hide Penetration', description: 'Kill the King Black Dragon with a stab weapon.', type: 'Restriction', monster: 'King Black Dragon' },
  { index: 166, tierId: 2, name: 'Antifire Protection', description: 'Kill the King Black Dragon with an antifire potion active and an antidragon shield equipped.', type: 'Restriction', monster: 'King Black Dragon' },
  { index: 167, tierId: 3, name: 'Who Is the King Now?', description: 'Kill The King Black Dragon 10 times in a privately rented instance without leaving the instance.', type: 'Stamina', monster: 'King Black Dragon' },
  { index: 168, tierId: 3, name: 'Kraken Adept', description: 'Kill the Kraken 20 times.', type: 'Kill Count', monster: 'Kraken' },
  { index: 169, tierId: 3, name: 'Unnecessary Optimisation', description: 'Kill the Kraken after killing all four tentacles.', type: 'Mechanical', monster: 'Kraken' },
  { index: 170, tierId: 3, name: 'Krakan\'t Hurt Me', description: 'Kill the Kraken 25 times in a privately rented instance without leaving the room.', type: 'Stamina', monster: 'Kraken' },
  { index: 171, tierId: 4, name: 'Ten-tacles', description: 'Kill the Kraken 50 times in a privately rented instance without leaving the room.', type: 'Stamina', monster: 'Kraken' },
  { index: 172, tierId: 5, name: 'One Hundred Tentacles', description: 'Kill the Kraken 100 times in a privately rented instance without leaving the room.', type: 'Stamina', monster: 'Kraken' },
  { index: 173, tierId: 2, name: 'Master of Broad Weaponry', description: 'Kill a Kurask.', type: 'Kill Count', monster: 'Kurask' },
  { index: 174, tierId: 1, name: 'A Scaley Encounter', description: 'Kill a Lizardman Shaman.', type: 'Kill Count', monster: 'Lizardman Shaman' },
  { index: 175, tierId: 1, name: 'Shayzien Protector', description: 'Kill a Lizardman Shaman in Molch which has not dealt damage to anyone (excluding its Spawns).', type: 'Perfection', monster: 'Lizardman Shaman' },
  { index: 176, tierId: 4, name: 'Mimic Veteran', description: 'Kill the Mimic once.', type: 'Kill Count', monster: 'Mimic' },
  { index: 177, tierId: 1, name: 'Giant Mole Novice', description: 'Kill the Giant Mole 10 times.', type: 'Kill Count', monster: 'Giant Mole' },
  { index: 178, tierId: 2, name: 'Giant Mole Champion', description: 'Kill the Giant mole 25 times.', type: 'Kill Count', monster: 'Giant Mole' },
  { index: 179, tierId: 3, name: 'Why Are You Running?', description: 'Kill the Giant Mole without her burrowing more than 2 times.', type: 'Mechanical', monster: 'Giant Mole' },
  { index: 180, tierId: 4, name: 'Hard Hitter', description: 'Kill the Giant Mole with 4 or fewer instances of damage.', type: 'Mechanical', monster: 'Giant Mole' },
  { index: 181, tierId: 3, name: 'Whack-a-Mole', description: 'Kill the Giant Mole within 10 seconds of her resurfacing.', type: 'Mechanical', monster: 'Giant Mole' },
  { index: 182, tierId: 2, name: 'Avoiding Those Little Arms', description: 'Kill the Giant Mole without her damaging anyone.', type: 'Perfection', monster: 'Giant Mole' },
  { index: 183, tierId: 3, name: 'Nightmare Adept', description: 'Kill The Nightmare once.', type: 'Kill Count', monster: 'The Nightmare' },
  { index: 184, tierId: 4, name: 'Nightmare Veteran', description: 'Kill The Nightmare 25 times.', type: 'Kill Count', monster: 'The Nightmare' },
  { index: 185, tierId: 5, name: 'Nightmare Master', description: 'Kill The Nightmare 50 times.', type: 'Kill Count', monster: 'The Nightmare' },
  { index: 186, tierId: 6, name: 'Terrible Parent', description: 'Kill the Nightmare solo without the Parasites healing the boss for more than 100 health.', type: 'Mechanical', monster: 'The Nightmare' },
  { index: 187, tierId: 4, name: 'Explosion!', description: 'Kill two Husks at the same time.', type: 'Mechanical', monster: 'The Nightmare' },
  { index: 188, tierId: 5, name: 'Perfect Nightmare', description: 'Kill the Nightmare without any player taking damage from the following attacks: Nightmare rifts, an un-cured parasite explosion, Corpse flowers or the Nightmare\'s Surge. Also, no player can take damage off prayer or have their attacks slowed by the Nightmare spores.', type: 'Perfection', monster: 'The Nightmare' },
  { index: 189, tierId: 4, name: 'Sleep Tight', description: 'Kill the Nightmare solo.', type: 'Restriction', monster: 'The Nightmare' },
  { index: 190, tierId: 6, name: 'A Long Trip', description: 'Kill the Nightmare without any player losing any prayer points.', type: 'Restriction', monster: 'The Nightmare' },
  { index: 191, tierId: 4, name: 'Nightmare (Solo) Speed-Trialist', description: 'Defeat the Nightmare (Solo) in less than 23 minutes.', type: 'Speed', monster: 'The Nightmare' },
  { index: 192, tierId: 5, name: 'Nightmare (Solo) Speed-Chaser', description: 'Defeat the Nightmare (Solo) in less than 19 minutes.', type: 'Speed', monster: 'The Nightmare' },
  { index: 193, tierId: 6, name: 'Nightmare (Solo) Speed-Runner', description: 'Defeat the Nightmare (Solo) in less than 16 minutes.', type: 'Speed', monster: 'The Nightmare' },
  { index: 194, tierId: 4, name: 'Nightmare (5-Scale) Speed-Trialist', description: 'Defeat the Nightmare (5-scale) in less than 5 minutes.', type: 'Speed', monster: 'The Nightmare' },
  { index: 195, tierId: 5, name: 'Nightmare (5-Scale) Speed-Chaser', description: 'Defeat the Nightmare (5-scale) in less than 4 minutes.', type: 'Speed', monster: 'The Nightmare' },
  { index: 196, tierId: 6, name: 'Nightmare (5-Scale) Speed-Runner', description: 'Defeat the Nightmare (5-scale) in less than 3:30 minutes.', type: 'Speed', monster: 'The Nightmare' },
  { index: 197, tierId: 2, name: 'Dagannoth Prime Champion', description: 'Kill Dagannoth Prime 10 times.', type: 'Kill Count', monster: 'Dagannoth Prime' },
  { index: 198, tierId: 3, name: 'Dagannoth Prime Adept', description: 'Kill Dagannoth Prime 25 times.', type: 'Kill Count', monster: 'Dagannoth Prime' },
  { index: 199, tierId: 4, name: 'Death to the Seer King', description: 'Kill Dagannoth Prime whilst under attack by Dagannoth Supreme and Dagannoth Rex.', type: 'Mechanical', monster: 'Dagannoth Prime' },
  { index: 200, tierId: 4, name: 'From One King to Another', description: 'Kill Prime using a Rune Thrownaxe special attack, bounced off Dagannoth Rex.', type: 'Mechanical', monster: 'Dagannoth Prime' },
  { index: 201, tierId: 2, name: 'Dagannoth Rex Champion', description: 'Kill Dagannoth Rex 10 times.', type: 'Kill Count', monster: 'Dagannoth Rex' },
  { index: 202, tierId: 3, name: 'Dagannoth Rex Adept', description: 'Kill Dagannoth Rex 25 times.', type: 'Kill Count', monster: 'Dagannoth Rex' },
  { index: 203, tierId: 4, name: 'Death to the Warrior King', description: 'Kill Dagannoth Rex whilst under attack by Dagannoth Supreme and Dagannoth Prime.', type: 'Mechanical', monster: 'Dagannoth Rex' },
  { index: 204, tierId: 2, name: 'A Frozen King', description: 'Kill Dagannoth Rex whilst he is immobilised.', type: 'Mechanical', monster: 'Dagannoth Rex' },
  { index: 205, tierId: 4, name: 'Toppling the Diarchy', description: 'Kill Dagannoth Rex and one other Dagannoth king at the exact same time.', type: 'Mechanical', monster: 'Dagannoth Rex' },
  { index: 206, tierId: 1, name: 'Sarachnis Novice', description: 'Kill Sarachnis 10 times.', type: 'Kill Count', monster: 'Sarachnis' },
  { index: 207, tierId: 2, name: 'Sarachnis Champion', description: 'Kill Sarachnis 25 times.', type: 'Kill Count', monster: 'Sarachnis' },
  { index: 208, tierId: 3, name: 'Ready to Pounce', description: 'Kill Sarachnis without her using her range attack twice in a row.', type: 'Mechanical', monster: 'Sarachnis' },
  { index: 209, tierId: 3, name: 'Inspect Repellent', description: 'Kill Sarachnis without her dealing damage to anyone.', type: 'Perfection', monster: 'Sarachnis' },
  { index: 210, tierId: 2, name: 'Newspaper Enthusiast', description: 'Kill Sarachnis with a crush weapon.', type: 'Restriction', monster: 'Sarachnis' },
  { index: 211, tierId: 3, name: 'Commander Zilyana Adept', description: 'Kill Commander Zilyana 50 times.', type: 'Kill Count', monster: 'Commander Zilyana' },
  { index: 212, tierId: 4, name: 'Commander Zilyana Veteran', description: 'Kill Commander Zilyana 100 times.', type: 'Kill Count', monster: 'Commander Zilyana' },
  { index: 213, tierId: 3, name: 'Commander Showdown', description: 'Finish off Commander Zilyana while all of her bodyguards are dead.', type: 'Mechanical', monster: 'Commander Zilyana' },
  { index: 214, tierId: 6, name: 'Animal Whisperer', description: 'Kill Commander Zilyana in a privately rented instance without taking any damage from the boss or bodyguards.', type: 'Perfection', monster: 'Commander Zilyana' },
  { index: 215, tierId: 5, name: 'Moving Collateral', description: 'Kill Commander Zilyana in a privately rented instance without attacking her directly.', type: 'Restriction', monster: 'Commander Zilyana' },
  { index: 216, tierId: 4, name: 'Reminisce', description: 'Kill Commander Zilyana in a privately rented instance with melee only.', type: 'Restriction', monster: 'Commander Zilyana' },
  { index: 217, tierId: 6, name: 'Peach Conjurer', description: 'Kill Commander Zilyana 50 times in a privately rented instance without leaving the room.', type: 'Stamina', monster: 'Commander Zilyana' },
  { index: 218, tierId: 3, name: 'Scorpia Adept', description: 'Kill Scorpia 10 times.', type: 'Kill Count', monster: 'Scorpia' },
  { index: 219, tierId: 4, name: 'Scorpia Veteran', description: 'Kill Scorpia 25 times.', type: 'Kill Count', monster: 'Scorpia' },
  { index: 220, tierId: 3, name: 'I Can\'t Reach That', description: 'Kill Scorpia without taking any damage from her.', type: 'Perfection', monster: 'Scorpia' },
  { index: 221, tierId: 3, name: 'Guardians No More', description: 'Kill Scorpia without killing her guardians.', type: 'Restriction', monster: 'Scorpia' },
  { index: 222, tierId: 4, name: 'Fragment of Seren Speed-Trialist', description: 'Kill The Fragment of Seren in less than 4 minutes.', type: 'Speed', monster: 'Fragment of Seren' },
  { index: 223, tierId: 2, name: 'A Frozen Foe from the Past', description: 'Kill a Skeletal Wyvern', type: 'Kill Count', monster: 'Skeletal Wyvern' },
  { index: 224, tierId: 3, name: 'Zulrah Adept', description: 'Kill Zulrah 25 times.', type: 'Kill Count', monster: 'Zulrah' },
  { index: 225, tierId: 4, name: 'Zulrah Veteran', description: 'Kill Zulrah 75 times.', type: 'Kill Count', monster: 'Zulrah' },
  { index: 226, tierId: 5, name: 'Zulrah Master', description: 'Kill Zulrah 150 times.', type: 'Kill Count', monster: 'Zulrah' },
  { index: 227, tierId: 4, name: 'Snake Rebound', description: 'Kill Zulrah by using the Vengeance spell as the finishing blow.', type: 'Mechanical', monster: 'Zulrah' },
  { index: 228, tierId: 4, name: 'Snake. Snake!? Snaaaaaake!', description: 'Kill 3 Snakelings simultaneously.', type: 'Mechanical', monster: 'Zulrah' },
  { index: 229, tierId: 5, name: 'Perfect Zulrah', description: 'Kill Zulrah whilst taking no damage from the following: Snakelings, Venom Clouds, Zulrah\'s Green or Crimson phase.', type: 'Perfection', monster: 'Zulrah' },
  { index: 230, tierId: 4, name: 'Zulrah Speed-Trialist', description: 'Kill Zulrah in less than 1 minute 20 seconds, without a slayer task.', type: 'Speed', monster: 'Zulrah' },
  { index: 231, tierId: 5, name: 'Zulrah Speed-Chaser', description: 'Kill Zulrah in less than 1 minute, without a slayer task.', type: 'Speed', monster: 'Zulrah' },
  { index: 232, tierId: 6, name: 'Zulrah Speed-Runner', description: 'Kill Zulrah in less than 54 seconds, without a slayer task.', type: 'Speed', monster: 'Zulrah' },
  { index: 233, tierId: 2, name: 'Dagannoth Supreme Champion', description: 'Kill Dagannoth Supreme 10 times.', type: 'Kill Count', monster: 'Dagannoth Supreme' },
  { index: 234, tierId: 3, name: 'Dagannoth Supreme Adept', description: 'Kill Dagannoth Supreme 25 times.', type: 'Kill Count', monster: 'Dagannoth Supreme' },
  { index: 235, tierId: 4, name: 'Death to the Archer King', description: 'Kill Dagannoth Supreme whilst under attack by Dagannoth Prime and Dagannoth Rex.', type: 'Mechanical', monster: 'Dagannoth Supreme' },
  { index: 236, tierId: 4, name: 'Rapid Succession', description: 'Kill all three Dagannoth Kings within 9 seconds of the first one.', type: 'Mechanical', monster: 'Dagannoth Supreme' },
  { index: 237, tierId: 4, name: 'Theatre of Blood Veteran', description: 'Complete the Theatre of Blood 25 times.', type: 'Kill Count', monster: 'Theatre of Blood' },
  { index: 238, tierId: 5, name: 'Theatre of Blood Master', description: 'Complete the Theatre of Blood 75 times.', type: 'Kill Count', monster: 'Theatre of Blood' },
  { index: 239, tierId: 6, name: 'Theatre of Blood Grandmaster', description: 'Complete the Theatre of Blood 150 times.', type: 'Kill Count', monster: 'Theatre of Blood' },
  { index: 240, tierId: 5, name: 'Two-Down', description: 'Kill the Pestilent Bloat before he shuts down for the third time.', type: 'Mechanical', monster: 'Theatre of Blood' },
  { index: 241, tierId: 5, name: 'Pop It', description: 'Kill Verzik without any Nylocas being frozen and without anyone taking damage from the Nylocas.', type: 'Mechanical', monster: 'Theatre of Blood' },
  { index: 242, tierId: 5, name: 'A Timely Snack', description: 'Kill Sotetseg after surviving at least 3 ball attacks without sharing the damage and without anyone dying throughout the fight.', type: 'Mechanical', monster: 'Theatre of Blood' },
  { index: 243, tierId: 6, name: 'Perfect Theatre', description: 'Complete the Theatre of Blood without anyone dying through any means and whilst everyone in the team completes the following Combat Achievement tasks in a single run: "Perfect Maiden", "Perfect Bloat", "Perfect Nylocas", "Perfect Sotetseg", "Perfect Xarpus" and "Perfect Verzik".', type: 'Perfection', monster: 'Theatre of Blood' },
  { index: 244, tierId: 5, name: 'Perfect Maiden', description: 'Kill The Maiden of Sugadinti without anyone in the team taking damage from the following sources: Blood Spawn projectiles and Blood Spawn trails. Also, without taking damage off prayer and without letting any of the Nylocas Matomenos heal The Maiden.', type: 'Perfection', monster: 'Theatre of Blood' },
  { index: 245, tierId: 5, name: 'Perfect Bloat', description: 'Kill the Pestilent Bloat without anyone in the team taking damage from the following sources: Pestilent flies, Falling body parts or The Pestilent Bloats stomp attack.', type: 'Perfection', monster: 'Theatre of Blood' },
  { index: 246, tierId: 5, name: 'Perfect Nylocas', description: 'Kill the Nylocas Vasilias without anyone in the team attacking any Nylocas with the wrong attack style, without letting a pillar collapse and without getting hit by any of the Nylocas Vasilias attacks whilst off prayer.', type: 'Perfection', monster: 'Theatre of Blood' },
  { index: 247, tierId: 5, name: 'Perfect Sotetseg', description: 'Kill Sotetseg without anyone in the team stepping on the wrong tile in the maze, without getting hit by the tornado and without taking any damage from Sotetseg\'s attacks whilst off prayer.', type: 'Perfection', monster: 'Theatre of Blood' },
  { index: 248, tierId: 5, name: 'Perfect Xarpus', description: 'Kill Xarpus without anyone in the team taking any damage from Xarpus\' attacks and without letting an exhumed heal Xarpus more than twice.', type: 'Perfection', monster: 'Theatre of Blood' },
  { index: 249, tierId: 5, name: 'Perfect Verzik', description: 'Defeat Verzik Vitur without anyone in the team taking damage from Verzik Vitur\'s attacks other than her spider form\'s correctly prayed against regular magical and ranged attacks.', type: 'Perfection', monster: 'Theatre of Blood' },
  { index: 250, tierId: 5, name: 'Can\'t Drain This', description: 'Kill The Maiden of Sugadinti without anyone in the team losing any prayer points.', type: 'Restriction', monster: 'Theatre of Blood' },
  { index: 251, tierId: 5, name: 'Can You Dance?', description: 'Kill Xarpus without anyone in the team using a ranged or magic weapon.', type: 'Restriction', monster: 'Theatre of Blood' },
  { index: 252, tierId: 6, name: 'Morytania Only', description: 'Complete the Theatre of Blood without any member of the team equipping a non-barrows weapon (except Dawnbringer).', type: 'Restriction', monster: 'Theatre of Blood' },
  { index: 253, tierId: 5, name: 'Back in My Day...', description: 'Complete the Theatre of Blood without any member of the team equipping a Scythe of Vitur.', type: 'Restriction', monster: 'Theatre of Blood' },
  { index: 254, tierId: 6, name: 'Theatre (Duo) Speed-Runner', description: 'Complete the Theatre of Blood (Duo) in less than 26 minutes.', type: 'Speed', monster: 'Theatre of Blood' },
  { index: 255, tierId: 5, name: 'Theatre (Trio) Speed-Chaser', description: 'Complete the Theatre of Blood (Trio) in less than 20 minutes.', type: 'Speed', monster: 'Theatre of Blood' },
  { index: 256, tierId: 6, name: 'Theatre (Trio) Speed-Runner', description: 'Complete the Theatre of Blood (Trio) in less than 17 minutes and 30 seconds.', type: 'Speed', monster: 'Theatre of Blood' },
  { index: 257, tierId: 5, name: 'Theatre (4-Scale) Speed-Chaser', description: 'Complete the Theatre of Blood (4-scale) in less than 17 minutes.', type: 'Speed', monster: 'Theatre of Blood' },
  { index: 258, tierId: 6, name: 'Theatre (4-Scale) Speed-Runner', description: 'Complete the Theatre of Blood (4-scale) in less than 15 minutes.', type: 'Speed', monster: 'Theatre of Blood' },
  { index: 259, tierId: 5, name: 'Theatre (5-Scale) Speed-Chaser', description: 'Complete the Theatre of Blood (5-scale) in less than 16 minutes.', type: 'Speed', monster: 'Theatre of Blood' },
  { index: 260, tierId: 6, name: 'Theatre (5-Scale) Speed-Runner', description: 'Complete the Theatre of Blood (5-scale) in less than 14 minutes and 15 seconds.', type: 'Speed', monster: 'Theatre of Blood' },
  { index: 261, tierId: 4, name: 'Thermonuclear Veteran', description: 'Kill the Thermonuclear Smoke Devil 20 times.', type: 'Kill Count', monster: 'Thermonuclear Smoke Devil' },
  { index: 262, tierId: 4, name: 'Hazard Prevention', description: 'Kill the Thermonuclear Smoke Devil without it hitting anyone.', type: 'Perfection', monster: 'Thermonuclear Smoke Devil' },
  { index: 263, tierId: 4, name: 'Spec\'d Out', description: 'Kill the Thermonuclear Smoke Devil using only special attacks.', type: 'Restriction', monster: 'Thermonuclear Smoke Devil' },
  { index: 264, tierId: 3, name: 'Venenatis Adept', description: 'Kill Venenatis 10 times.', type: 'Kill Count', monster: 'Venenatis' },
  { index: 265, tierId: 4, name: 'Venenatis Veteran', description: 'Kill Venenatis 20 times.', type: 'Kill Count', monster: 'Venenatis' },
  { index: 266, tierId: 3, name: 'Vet\'ion Adept', description: 'Kill Vet\'ion 10 times.', type: 'Kill Count', monster: 'Vet\'ion' },
  { index: 267, tierId: 4, name: 'Vet\'eran', description: 'Kill Vet\'ion 20 times.', type: 'Kill Count', monster: 'Vet\'ion' },
  { index: 268, tierId: 4, name: 'Vorkath Veteran', description: 'Kill Vorkath 50 times.', type: 'Kill Count', monster: 'Vorkath' },
  { index: 269, tierId: 5, name: 'Vorkath Master', description: 'Kill Vorkath 100 times.', type: 'Kill Count', monster: 'Vorkath' },
  { index: 270, tierId: 5, name: 'The Walk', description: 'Hit Vorkath 12 times during the acid special without getting hit by his rapid fire or the acid pools.', type: 'Mechanical', monster: 'Vorkath' },
  { index: 271, tierId: 4, name: 'Zombie Destroyer', description: 'Kill Vorkath\'s zombified spawn without using crumble undead.', type: 'Restriction', monster: 'Vorkath' },
  { index: 272, tierId: 5, name: 'Dodging the Dragon', description: 'Kill Vorkath 5 times without taking any damage from his special attacks and without leaving his area.', type: 'Perfection', monster: 'Vorkath' },
  { index: 273, tierId: 4, name: 'Stick \'em With the Pointy End', description: 'Kill Vorkath using melee weapons only.', type: 'Restriction', monster: 'Vorkath' },
  { index: 274, tierId: 6, name: 'Faithless Encounter', description: 'Kill Vorkath without losing any prayer points.', type: 'Restriction', monster: 'Vorkath' },
  { index: 275, tierId: 6, name: 'The Fremennik Way', description: 'Kill Vorkath with only your fists.', type: 'Restriction', monster: 'Vorkath' },
  { index: 276, tierId: 5, name: 'Vorkath Speed-Chaser', description: 'Kill Vorkath in less than 1 minute and 15 seconds.', type: 'Speed', monster: 'Vorkath' },
  { index: 277, tierId: 6, name: 'Vorkath Speed-Runner', description: 'Kill Vorkath in less than 54 seconds.', type: 'Speed', monster: 'Vorkath' },
  { index: 278, tierId: 5, name: 'Extended Encounter', description: 'Kill Vorkath 10 times without leaving his area.', type: 'Stamina', monster: 'Vorkath' },
  { index: 279, tierId: 1, name: 'Wintertodt Novice', description: 'Subdue the Wintertodt 5 times.', type: 'Kill Count', monster: 'Wintertodt' },
  { index: 280, tierId: 2, name: 'Wintertodt Champion', description: 'Subdue the Wintertodt 10 times.', type: 'Kill Count', monster: 'Wintertodt' },
  { index: 281, tierId: 1, name: 'Mummy!', description: 'Heal a pyromancer after they have fallen.', type: 'Mechanical', monster: 'Wintertodt' },
  { index: 282, tierId: 1, name: 'Handyman', description: 'Repair a brazier which has been destroyed by the Wintertodt.', type: 'Mechanical', monster: 'Wintertodt' },
  { index: 283, tierId: 2, name: 'Can We Fix It?', description: 'Subdue the Wintertodt without allowing all 4 braziers to be broken at the same time.', type: 'Perfection', monster: 'Wintertodt' },
  { index: 284, tierId: 2, name: 'Leaving No One Behind', description: 'Subdue the Wintertodt without any of the Pyromancers falling.', type: 'Restriction', monster: 'Wintertodt' },
  { index: 285, tierId: 1, name: 'Cosy', description: 'Subdue the Wintertodt with four pieces of warm equipment equipped.', type: 'Restriction', monster: 'Wintertodt' },
  { index: 286, tierId: 3, name: 'Why Fletch?', description: 'Subdue the Wintertodt after earning 3000 or more points.', type: 'Stamina', monster: 'Wintertodt' },
  { index: 287, tierId: 1, name: 'A Slithery Encounter', description: 'Kill a Wyrm.', type: 'Kill Count', monster: 'Wyrm' },
  { index: 288, tierId: 5, name: 'Chambers of Xeric: CM Master', description: 'Complete the Chambers of Xeric: Challenge Mode 10 times.', type: 'Kill Count', monster: 'Chambers of Xeric: CM' },
  { index: 289, tierId: 6, name: 'Chambers of Xeric: CM Grandmaster', description: 'Complete the Chambers of Xeric: Challenge Mode 25 times.', type: 'Kill Count', monster: 'Chambers of Xeric: CM' },
  { index: 290, tierId: 5, name: 'Immortal Raid Team', description: 'Complete a Chambers of Xeric: Challenge mode raid without anyone dying.', type: 'Perfection', monster: 'Chambers of Xeric: CM' },
  { index: 291, tierId: 5, name: 'Immortal Raider', description: 'Complete a Chambers of Xeric Challenge mode (Solo) raid without dying.', type: 'Perfection', monster: 'Chambers of Xeric: CM' },
  { index: 292, tierId: 4, name: 'Dust Seeker', description: 'Complete a Chambers of Xeric Challenge mode raid in the target time.', type: 'Speed', monster: 'Chambers of Xeric: CM' },
  { index: 293, tierId: 5, name: 'Chambers of Xeric: CM (Solo) Speed-Chaser', description: 'Complete a Chambers of Xeric: Challenge Mode (Solo) in less than 45 minutes.', type: 'Speed', monster: 'Chambers of Xeric: CM' },
  { index: 294, tierId: 6, name: 'Chambers of Xeric: CM (Solo) Speed-Runner', description: 'Complete a Chambers of Xeric: Challenge Mode (Solo) in less than 38 minutes and 30 seconds.', type: 'Speed', monster: 'Chambers of Xeric: CM' },
  { index: 295, tierId: 5, name: 'Chambers of Xeric: CM (5-Scale) Speed-Chaser', description: 'Complete a Chambers of Xeric: Challenge Mode (5-scale) in less than 30 minutes.', type: 'Speed', monster: 'Chambers of Xeric: CM' },
  { index: 296, tierId: 6, name: 'Chambers of Xeric: CM (5-Scale) Speed-Runner', description: 'Complete a Chambers of Xeric: Challenge Mode (5-scale) in less than 25 minutes.', type: 'Speed', monster: 'Chambers of Xeric: CM' },
  { index: 297, tierId: 5, name: 'Chambers of Xeric: CM (Trio) Speed-Chaser', description: 'Complete a Chambers of Xeric: Challenge Mode (Trio) in less than 35 minutes.', type: 'Speed', monster: 'Chambers of Xeric: CM' },
  { index: 298, tierId: 6, name: 'Chambers of Xeric: CM (Trio) Speed-Runner', description: 'Complete a Chambers of Xeric: Challenge Mode (Trio) in less than 27 minutes.', type: 'Speed', monster: 'Chambers of Xeric: CM' },
  { index: 299, tierId: 4, name: 'Chambers of Xeric Veteran', description: 'Complete the Chambers of Xeric 25 times.', type: 'Kill Count', monster: 'Chambers of Xeric' },
  { index: 300, tierId: 5, name: 'Chambers of Xeric Master', description: 'Complete the Chambers of Xeric 75 times.', type: 'Kill Count', monster: 'Chambers of Xeric' },
  { index: 301, tierId: 6, name: 'Chambers of Xeric Grandmaster', description: 'Complete the Chambers of Xeric 150 times.', type: 'Kill Count', monster: 'Chambers of Xeric' },
  { index: 302, tierId: 4, name: 'Perfectly Balanced', description: 'Kill the Vanguards without them resetting their health.', type: 'Mechanical', monster: 'Chambers of Xeric' },
  { index: 303, tierId: 4, name: 'Together We\'ll Fall', description: 'Kill the Vanguards within 10 seconds of the first one dying.', type: 'Mechanical', monster: 'Chambers of Xeric' },
  { index: 304, tierId: 5, name: 'No Time for Death', description: 'Clear the Tightrope room without Killing any Deathly Mages or Deathly Rangers.', type: 'Mechanical', monster: 'Chambers of Xeric' },
  { index: 305, tierId: 5, name: 'Putting It Olm on the Line', description: 'Complete a Chambers of Xeric solo raid with more than 40,000 points.', type: 'Mechanical', monster: 'Chambers of Xeric' },
  { index: 306, tierId: 5, name: 'A Not So Special Lizard', description: 'Kill the Great Olm in a solo raid without letting him use any of the following special attacks in his second to last phase: Crystal Burst, Lightning Walls, Teleportation Portals or left-hand autohealing.', type: 'Mechanical', monster: 'Chambers of Xeric' },
  { index: 307, tierId: 4, name: 'Mutta-diet', description: 'Kill the Muttadile without letting her or her baby recover hitpoints from the meat tree.', type: 'Mechanical', monster: 'Chambers of Xeric' },
  { index: 308, tierId: 4, name: 'Redemption Enthusiast', description: 'Kill the Abyssal Portal without forcing Vespula to land.', type: 'Mechanical', monster: 'Chambers of Xeric' },
  { index: 309, tierId: 5, name: 'Stop Drop and Roll', description: 'Kill Vasa Nistirio before he performs his teleport attack for the second time.', type: 'Mechanical', monster: 'Chambers of Xeric' },
  { index: 310, tierId: 5, name: 'Anvil No More', description: 'Kill Tekton before he returns to his anvil for a second time after the fight begins.', type: 'Mechanical', monster: 'Chambers of Xeric' },
  { index: 311, tierId: 4, name: 'Dancing with Statues', description: 'Receive kill-credit for a Stone Guardian without taking damage from falling rocks.', type: 'Perfection', monster: 'Chambers of Xeric' },
  { index: 312, tierId: 4, name: 'Undying Raid Team', description: 'Complete a Chambers of Xeric raid without anyone dying.', type: 'Perfection', monster: 'Chambers of Xeric' },
  { index: 313, tierId: 5, name: 'Undying Raider', description: 'Complete a Chambers of Xeric solo raid without dying.', type: 'Perfection', monster: 'Chambers of Xeric' },
  { index: 314, tierId: 4, name: 'Shayzien Specialist', description: 'Receive kill-credit for a Lizardman Shaman without taking damage from any shamans in the room.', type: 'Perfection', monster: 'Chambers of Xeric' },
  { index: 315, tierId: 5, name: 'Playing with Lasers', description: 'Clear the Crystal Crabs room without wasting an orb after the first crystal has been activated.', type: 'Perfection', monster: 'Chambers of Xeric' },
  { index: 316, tierId: 4, name: 'Cryo No More', description: 'Receive kill-credit for the Ice Demon without taking any damage.', type: 'Perfection', monster: 'Chambers of Xeric' },
  { index: 317, tierId: 5, name: 'Perfect Olm (Solo)', description: 'Kill the Great Olm in a solo raid without taking damage from any of the following: Teleport portals, Fire Walls, Healing pools, Crystal Bombs, Crystal Burst or Prayer Orbs. You also cannot let his claws regenerate or take damage from the same acid pool back to back.', type: 'Perfection', monster: 'Chambers of Xeric' },
  { index: 318, tierId: 5, name: 'Perfect Olm (Trio)', description: 'Kill the Great Olm in a trio raid without any team member taking damage from any of the following: Teleport portals, Fire Walls, Healing pools, Crystal Bombs, Crystal Burst or Prayer Orbs. You also cannot let his claws regenerate or take damage from the same acid pool back to back.', type: 'Perfection', monster: 'Chambers of Xeric' },
  { index: 319, tierId: 5, name: 'Blind Spot', description: 'Kill Tekton without taking any damage.', type: 'Perfection', monster: 'Chambers of Xeric' },
  { index: 320, tierId: 4, name: 'Blizzard Dodger', description: 'Receive kill-credit for the Ice Demon without activating the Protect from Range prayer.', type: 'Restriction', monster: 'Chambers of Xeric' },
  { index: 321, tierId: 4, name: 'Kill It with Fire', description: 'Finish off the Ice Demon with a fire spell.', type: 'Restriction', monster: 'Chambers of Xeric' },
  { index: 322, tierId: 5, name: 'Chambers of Xeric (Solo) Speed-Chaser', description: 'Complete a Chambers of Xeric (Solo) in less than 21 minutes.', type: 'Speed', monster: 'Chambers of Xeric' },
  { index: 323, tierId: 6, name: 'Chambers of Xeric (Solo) Speed-Runner', description: 'Complete a Chambers of Xeric (Solo) in less than 17 minutes.', type: 'Speed', monster: 'Chambers of Xeric' },
  { index: 324, tierId: 5, name: 'Chambers of Xeric (5-Scale) Speed-Chaser', description: 'Complete a Chambers of Xeric (5-scale) in less than 15 minutes.', type: 'Speed', monster: 'Chambers of Xeric' },
  { index: 325, tierId: 6, name: 'Chambers of Xeric (5-Scale) Speed-Runner', description: 'Complete a Chambers of Xeric (5-scale) in less than 12 minutes and 30 seconds.', type: 'Speed', monster: 'Chambers of Xeric' },
  { index: 326, tierId: 5, name: 'Chambers of Xeric (Trio) Speed-Chaser', description: 'Complete a Chambers of Xeric (Trio) in less than 16 minutes and 30 seconds.', type: 'Speed', monster: 'Chambers of Xeric' },
  { index: 327, tierId: 6, name: 'Chambers of Xeric (Trio) Speed-Runner', description: 'Complete a Chambers of Xeric (Trio) in less than 14 minutes and 30 seconds.', type: 'Speed', monster: 'Chambers of Xeric' },
  { index: 328, tierId: 4, name: 'Zalcano Veteran', description: 'Kill Zalcano 25 times.', type: 'Kill Count', monster: 'Zalcano' },
  { index: 329, tierId: 4, name: 'Perfect Zalcano', description: 'Kill Zalcano 5 times in a row without leaving or getting hit by the following: Falling rocks, rock explosions, Zalcano powering up, or standing in a red symbol.', type: 'Perfection', monster: 'Zalcano' },
  { index: 330, tierId: 4, name: 'Team Player', description: 'Receive imbued tephra from a golem.', type: 'Mechanical', monster: 'Zalcano' },
  { index: 331, tierId: 4, name: 'The Spurned Hero', description: 'Kill Zalcano as the player who has dealt the most damage to her.', type: 'Mechanical', monster: 'Zalcano' },
  { index: 332, tierId: 3, name: 'K\'ril Tsutsaroth Adept', description: 'Kill K\'ril Tsutsaroth 50 times.', type: 'Kill Count', monster: 'K\'ril Tsutsaroth' },
  { index: 333, tierId: 4, name: 'K\'ril Tsutsaroth Veteran', description: 'Kill K\'ril Tsutsaroth 100 times.', type: 'Kill Count', monster: 'K\'ril Tsutsaroth' },
  { index: 334, tierId: 3, name: 'Yarr No More', description: 'Receive kill-credit for K\'ril Tsutsaroth without him using his special attack.', type: 'Mechanical', monster: 'K\'ril Tsutsaroth' },
  { index: 335, tierId: 3, name: 'Demonic Showdown', description: 'Finish off K\'ril Tsutsaroth whilst all of his bodyguards are dead.', type: 'Mechanical', monster: 'K\'ril Tsutsaroth' },
  { index: 336, tierId: 4, name: 'The Bane of Demons', description: 'Defeat K\'ril Tsutsaroth in a privately rented instance using only demonbane spells.', type: 'Mechanical', monster: 'K\'ril Tsutsaroth' },
  { index: 337, tierId: 4, name: 'Demonic Defence', description: 'Kill K\'ril Tsutsaroth in a privately rented instance without taking any of his melee hits.', type: 'Perfection', monster: 'K\'ril Tsutsaroth' },
  { index: 338, tierId: 6, name: 'Demon Whisperer', description: 'Kill K\'ril Tsutsaroth in a privately rented instance without ever being hit by his bodyguards.', type: 'Perfection', monster: 'K\'ril Tsutsaroth' },
  { index: 339, tierId: 3, name: 'Demonbane Weaponry II', description: 'Finish off K\'ril Tsutsaroth with a demonbane weapon.', type: 'Restriction', monster: 'K\'ril Tsutsaroth' },
  { index: 340, tierId: 6, name: 'Ash Collector', description: 'Kill K\'ril Tsutsaroth 20 times in a privately rented instance without leaving the room.', type: 'Stamina', monster: 'K\'ril Tsutsaroth' },
  { index: 341, tierId: 4, name: 'Half-Way There', description: 'Kill a Jal-Zek within the Inferno.', type: 'Kill Count', monster: 'TzKal-Zuk' },
  { index: 342, tierId: 6, name: 'Inferno Grandmaster', description: 'Complete the Inferno 5 times.', type: 'Kill Count', monster: 'TzKal-Zuk' },
  { index: 343, tierId: 6, name: 'The Floor Is Lava', description: 'Kill TzKal-Zuk without letting Jal-ImKot dig during any wave in the Inferno.', type: 'Mechanical', monster: 'TzKal-Zuk' },
  { index: 344, tierId: 6, name: 'Playing with Jads', description: 'Complete wave 68 of the Inferno within 30 seconds of the first JalTok-Jad dying.', type: 'Mechanical', monster: 'TzKal-Zuk' },
  { index: 345, tierId: 6, name: 'No Luck Required', description: 'Kill TzKal-Zuk without being attacked by TzKal-Zuk and without taking damage from a JalTok-Jad.', type: 'Perfection', monster: 'TzKal-Zuk' },
  { index: 346, tierId: 5, name: 'Nibblers, Begone!', description: 'Kill TzKal-Zuk without letting a pillar fall before wave 67.', type: 'Perfection', monster: 'TzKal-Zuk' },
  { index: 347, tierId: 6, name: 'Wasn\'t Even Close', description: 'Kill TzKal-Zuk without letting your hitpoints fall below 50 during any wave in the Inferno.', type: 'Restriction', monster: 'TzKal-Zuk' },
  { index: 348, tierId: 6, name: 'Budget Setup', description: 'Kill TzKal-Zuk without equipping a Twisted Bow within the Inferno.', type: 'Restriction', monster: 'TzKal-Zuk' },
  { index: 349, tierId: 6, name: 'Nibbler Chaser', description: 'Kill TzKal-Zuk without using any magic spells during any wave in the Inferno.', type: 'Restriction', monster: 'TzKal-Zuk' },
  { index: 350, tierId: 6, name: 'Facing Jad Head-on II', description: 'Kill TzKal-Zuk without equipping any range or mage weapons before wave 69.', type: 'Restriction', monster: 'TzKal-Zuk' },
  { index: 351, tierId: 6, name: 'Jad? What Are You Doing Here?', description: 'Kill TzKal-Zuk without killing the JalTok-Jad which spawns during wave 69.', type: 'Restriction', monster: 'TzKal-Zuk' },
  { index: 352, tierId: 6, name: 'Inferno Speed-Runner', description: 'Complete the Inferno in less than 65 minutes.', type: 'Speed', monster: 'TzKal-Zuk' },
  { index: 353, tierId: 1, name: 'Tempoross Novice', description: 'Subdue Tempoross 5 times.', type: 'Kill Count', monster: 'Tempoross' },
  { index: 354, tierId: 2, name: 'Tempoross Champion', description: 'Subdue Tempoross 10 times.', type: 'Kill Count', monster: 'Tempoross' },
  { index: 355, tierId: 3, name: 'Dress Like You Mean It', description: 'Subdue Tempoross while wearing any variation of the angler outfit.', type: 'Restriction', monster: 'Tempoross' },
  { index: 356, tierId: 1, name: 'Master of Buckets', description: 'Extinguish at least 5 fires during a single Tempoross fight.', type: 'Mechanical', monster: 'Tempoross' },
  { index: 357, tierId: 1, name: 'Calm Before the Storm', description: 'Repair either a mast or a totem pole.', type: 'Mechanical', monster: 'Tempoross' },
  { index: 358, tierId: 3, name: 'Why Cook?', description: 'Subdue Tempoross, getting rewarded with 10 reward permits from a single Tempoross fight.', type: 'Mechanical', monster: 'Tempoross' },
  { index: 359, tierId: 2, name: 'The Lone Angler', description: 'Subdue Tempoross alone without getting hit by any fires, torrents or waves.', type: 'Perfection', monster: 'Tempoross' },
  { index: 360, tierId: 1, name: 'Fire in the Hole!', description: 'Attack Tempoross from both sides by loading both cannons on both ships.', type: 'Mechanical', monster: 'Tempoross' },
  { index: 361, tierId: 4, name: 'The II Jad Challenge', description: 'Complete TzHaar-Ket-Rak\'s second challenge.', type: 'Kill Count', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 362, tierId: 5, name: 'The IV Jad Challenge', description: 'Complete TzHaar-Ket-Rak\'s fourth challenge.', type: 'Kill Count', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 363, tierId: 6, name: 'The VI Jad Challenge', description: 'Complete TzHaar-Ket-Rak\'s sixth challenge.', type: 'Kill Count', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 364, tierId: 4, name: 'TzHaar-Ket-Rak\'s Speed-Trialist', description: 'Complete TzHaar-Ket-Rak\'s first challenge in less than 45 seconds.', type: 'Speed', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 365, tierId: 5, name: 'TzHaar-Ket-Rak\'s Speed-Chaser', description: 'Complete TzHaar-Ket-Rak\'s third challenge in less than 3 minutes.', type: 'Speed', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 366, tierId: 6, name: 'TzHaar-Ket-Rak\'s Speed-Runner', description: 'Complete TzHaar-Ket-Rak\'s fifth challenge in less than 5 minutes.', type: 'Speed', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 367, tierId: 4, name: 'Facing Jad Head-on III', description: 'Complete TzHaar-Ket-Rak\'s second challenge with only melee.', type: 'Restriction', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 368, tierId: 5, name: 'Facing Jad Head-on IV', description: 'Complete TzHaar-Ket-Rak\'s fourth challenge with only melee.', type: 'Restriction', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 369, tierId: 5, name: 'Supplies? Who Needs \'em?', description: 'Complete TzHaar-Ket-Rak\'s third challenge without having anything in your inventory.', type: 'Perfection', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 370, tierId: 6, name: 'It Wasn\'t a Fluke', description: 'Complete TzHaar-Ket-Rak\'s fifth and sixth challenges back to back without failing.', type: 'Perfection', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 371, tierId: 5, name: 'Multi-Style Specialist', description: 'Complete TzHaar-Ket-Rak\'s third challenge while using a different attack style for each JalTok-Jad.', type: 'Mechanical', monster: 'TzHaar-Ket-Rak\'s Challenges' },
  { index: 372, tierId: 6, name: 'Stop Right There!', description: 'Defeat the Maiden of Sugadinti in the Theatre of Blood: Hard Mode without letting blood spawns create more than 15 blood trails.', type: 'Mechanical', monster: 'Theatre of Blood: Hard Mode' },
  { index: 373, tierId: 6, name: 'Personal Space', description: 'Defeat the Pestilent Bloat in the Theatre of Blood: Hard Mode with at least 3 people in the room, without anyone in your team standing on top of each other.', type: 'Mechanical', monster: 'Theatre of Blood: Hard Mode' },
  { index: 374, tierId: 6, name: 'Royal Affairs', description: 'In the Theatre of Blood: Hard Mode, complete the Nylocas room without ever letting the Nylocas Prinkipas change styles.', type: 'Mechanical', monster: 'Theatre of Blood: Hard Mode' },
  { index: 375, tierId: 6, name: 'Harder Mode I', description: 'Defeat Sotetseg in the Theatre of Blood: Hard Mode without anyone sharing the ball with anyone, without anyone dying, and without anyone taking damage from any of its other attacks or stepping on the wrong tile in the maze.', type: 'Perfection', monster: 'Theatre of Blood: Hard Mode' },
  { index: 376, tierId: 6, name: 'Harder Mode II', description: 'Defeat Xarpus in the Theatre of Blood: Hard Mode after letting the exhumeds heal him to full health and without anyone in the team taking any damage.', type: 'Perfection', monster: 'Theatre of Blood: Hard Mode' },
  { index: 377, tierId: 6, name: 'Nylo Sniper', description: 'Defeat Verzik Vitur in the Theatre of Blood: Hard Mode without anyone in your team causing a Nylocas to explode by getting too close.', type: 'Mechanical', monster: 'Theatre of Blood: Hard Mode' },
  { index: 378, tierId: 6, name: 'Team Work Makes the Dream Work', description: 'When Verzik Vitur in the Theatre of Blood: Hard Mode uses her yellow power blast attack while the tornadoes are active, have everyone get through the attack without taking damage. This cannot be completed with one player alive', type: 'Mechanical', monster: 'Theatre of Blood: Hard Mode' },
  { index: 379, tierId: 6, name: 'Harder Mode III', description: 'Defeat Verzik Vitur in the Theatre of Blood: Hard Mode without anyone attacking her with a melee weapon during her third phase.', type: 'Restriction', monster: 'Theatre of Blood: Hard Mode' },
  { index: 380, tierId: 6, name: 'Pack Like a Yak', description: 'Complete the Theatre of Blood: Hard Mode within the challenge time, with no deaths and without anyone buying anything from a supply chest.', type: 'Restriction', monster: 'Theatre of Blood: Hard Mode' },
  { index: 381, tierId: 5, name: 'Hard Mode? Completed It', description: 'Complete the Theatre of Blood: Hard Mode within the challenge time.', type: 'Speed', monster: 'Theatre of Blood: Hard Mode' },
  { index: 382, tierId: 6, name: 'Theatre: HM (Trio) Speed-Runner', description: 'Complete the Theatre of Blood: Hard Mode (Trio) with an overall time of less than 23 minutes.', type: 'Speed', monster: 'Theatre of Blood: Hard Mode' },
  { index: 383, tierId: 6, name: 'Theatre: HM (4-Scale) Speed-Runner', description: '	Complete the Theatre of Blood: Hard Mode (4-scale) with an overall time of less than 21 minutes.', type: 'Speed', monster: 'Theatre of Blood: Hard Mode' },
  { index: 384, tierId: 6, name: 'Theatre: HM (5-Scale) Speed-Runner', description: 'Complete the Theatre of Blood: Hard Mode (5-scale) with an overall time of less than 19 minutes.', type: 'Speed', monster: 'Theatre of Blood: Hard Mode' },
  { index: 385, tierId: 6, name: 'Theatre of Blood: HM Grandmaster', description: 'Complete the Theatre of Blood: Hard Mode 50 times.', type: 'Kill Count', monster: 'Theatre of Blood: Hard Mode' },
  { index: 386, tierId: 4, name: 'Anticoagulants', description: 'Defeat the Maiden of Sugadinti in the Theatre of Blood: Entry Mode without letting any bloodspawn live for longer than 10 seconds.', type: 'Mechanical', monster: 'Theatre of Blood: Entry Mode' },
  { index: 387, tierId: 4, name: 'Appropriate Tools', description: 'Defeat the Pestilent Bloat in the Theatre of Blood: Entry Mode with everyone having a salve amulet equipped.', type: 'Mechanical', monster: 'Theatre of Blood: Entry Mode' },
  { index: 388, tierId: 4, name: 'They Won\'t Expect This', description: 'In the Theatre of Blood: Entry Mode, enter the Pestilent Bloat room from the opposite side.', type: 'Mechanical', monster: 'Theatre of Blood: Entry Mode' },
  { index: 389, tierId: 4, name: 'Chally Time', description: 'Defeat the Pestilent Bloat in the Theatre of Blood: Entry Mode by using a halberd special attack as your final attack.', type: 'Mechanical', monster: 'Theatre of Blood: Entry Mode' },
  { index: 390, tierId: 4, name: 'Nylocas, On the Rocks', description: 'In the Theatre of Blood: Entry Mode, freeze any 4 Nylocas with a single Ice Barrage spell.', type: 'Mechanical', monster: 'Theatre of Blood: Entry Mode' },
  { index: 391, tierId: 4, name: 'Just To Be Safe', description: 'Defeat Sotetseg in the Theatre of Blood: Entry Mode after having split the big ball with your entire team. This must be done with a group size of at least 2.', type: 'Mechanical', monster: 'Theatre of Blood: Entry Mode' },
  { index: 392, tierId: 4, name: 'Don\'t Look at Me!', description: 'Kill Xarpus in the Theatre of Blood: Entry Mode without him reflecting any damage to anyone.', type: 'Mechanical', monster: 'Theatre of Blood: Entry Mode' },
  { index: 393, tierId: 4, name: 'No-Pillar', description: 'Survive Verzik Vitur\'s pillar phase in the Theatre of Blood: Entry Mode without losing a single pillar.', type: 'Mechanical', monster: 'Theatre of Blood: Entry Mode' },
  { index: 394, tierId: 4, name: 'Attack, Step, Wait', description: 'Survive Verzik Vitur\'s second phase in the Theatre of Blood: Entry Mode without anyone getting bounced by Verzik.', type: 'Mechanical', monster: 'Theatre of Blood: Entry Mode' },
  { index: 395, tierId: 4, name: 'Pass It On', description: 'In the Theatre of Blood: Entry Mode, successfully pass on the green ball to a team mate.', type: 'Mechanical', monster: 'Theatre of Blood: Entry Mode' },
  { index: 396, tierId: 5, name: 'Theatre of Blood: SM Speed-Chaser', description: 'Complete the Theatre of Blood: Entry Mode in less than 17 minutes.', type: 'Speed', monster: 'Theatre of Blood: Entry Mode' },
  { index: 397, tierId: 3, name: 'Theatre of Blood: SM Adept', description: 'Complete the Theatre of Blood: Entry Mode 1 time.', type: 'Kill Count', monster: 'Theatre of Blood: Entry Mode' },
  { index: 398, tierId: 1, name: 'Into the Den of Giants', description: 'Kill a Hill Giant, Moss Giant and Fire Giant in the Giant Cave within the Shayzien region.', type: 'Kill Count', monster: 'Unknown' },
  { index: 399, tierId: 2, name: 'Sit Back and Relax', description: 'Deal 100 damage to creatures using undead thralls.', type: 'Mechanical', monster: 'Other' },
  { index: 400, tierId: 4, name: 'Phosani\'s Veteran', description: 'Kill Phosani\'s Nightmare once.', type: 'Kill Count', monster: 'Phosani\'s Nightmare' },
  { index: 401, tierId: 5, name: 'Phosani\'s Master', description: 'Kill Phosani\'s Nightmare 5 times.', type: 'Kill Count', monster: 'Phosani\'s Nightmare' },
  { index: 402, tierId: 6, name: 'Phosani\'s Grandmaster', description: 'Kill Phosani\'s Nightmare 25 times.', type: 'Kill Count', monster: 'Phosani\'s Nightmare' },
  { index: 403, tierId: 6, name: 'Perfect Phosani\'s Nightmare', description: 'Kill Phosani\'s Nightmare while only taking damage from husks, power blasts and weakened parasites. Also, without becoming infected by spores or letting a sleepwalker reach Phosani\'s Nightmare.', type: 'Perfection', monster: 'Phosani\'s Nightmare' },
  { index: 404, tierId: 5, name: 'Phosani\'s Speedchaser', description: 'Kill Phosani\'s Nightmare within 7 minutes and 30 seconds', type: 'Speed', monster: 'Phosani\'s Nightmare' },
  { index: 405, tierId: 6, name: 'Phosani\'s Speedrunner', description: 'Kill Phosani\'s Nightmare within 6 minutes.', type: 'Speed', monster: 'Phosani\'s Nightmare' },
  { index: 406, tierId: 5, name: 'Crush Hour', description: 'Kill Phosani\'s Nightmare while killing every husk and parasite in one hit.', type: 'Mechanical', monster: 'Phosani\'s Nightmare' },
  { index: 407, tierId: 5, name: 'I Would Simply React', description: 'Kill Phosani\'s Nightmare without her disabling your prayer.', type: 'Mechanical', monster: 'Phosani\'s Nightmare' },
  { index: 408, tierId: 5, name: 'Dreamland Express', description: 'Kill Phosani\'s Nightmare without letting a sleepwalker reach her during the desperation phase.', type: 'Mechanical', monster: 'Phosani\'s Nightmare' },
  { index: 409, tierId: 6, name: 'Can\'t Wake Up', description: 'Kill Phosani\'s Nightmare 5 times in a row without leaving Phosani\'s Dream.', type: 'Stamina', monster: 'Phosani\'s Nightmare' },
  { index: 410, tierId: 4, name: 'Nex Veteran', description: 'Kill Nex once.', type: 'Kill Count', monster: 'Nex' },
  { index: 411, tierId: 5, name: 'Nex Master', description: 'Kill Nex 25 times.', type: 'Kill Count', monster: 'Nex' },
  { index: 412, tierId: 4, name: 'Nex Survivors', description: 'Kill Nex without anyone dying.', type: 'Restriction', monster: 'Nex' },
  { index: 413, tierId: 5, name: 'A siphon will solve this', description: 'Kill Nex without letting her heal from her Blood Siphon special attack.', type: 'Mechanical', monster: 'Nex' },
  { index: 414, tierId: 5, name: 'Contain this!', description: 'Kill Nex without anyone taking damage from any Ice special attack.', type: 'Mechanical', monster: 'Nex' },
  { index: 415, tierId: 5, name: 'There is no escape!', description: 'Kill Nex without anyone being hit by the Smoke Dash special attack', type: 'Mechanical', monster: 'Nex' },
  { index: 416, tierId: 5, name: 'Nex Trio', description: 'Kill Nex with three or less players inside the arena at the start of the fight.', type: 'Restriction', monster: 'Nex' },
  { index: 417, tierId: 6, name: 'Nex Duo', description: 'Kill Nex with two or less players inside the arena at the start of the fight.', type: 'Restriction', monster: 'Nex' },
  { index: 418, tierId: 6, name: 'I should see a doctor', description: 'Kill Nex whilst a player is coughing.', type: 'Restriction', monster: 'Nex' },
  { index: 419, tierId: 6, name: 'Perfect Nex', description: 'Kill Nex whilst completing the requirements for There is no escape, Shadows move, A siphon will solve this, and Contain this!', type: 'Perfection', monster: 'Nex' },
  { index: 420, tierId: 5, name: 'Shadows Move...', description: 'Kill Nex without anyone being hit by the Shadow Smash attack.', type: 'Mechanical', monster: 'Nex' },
  { index: 421, tierId: 5, name: 'Tombs Speed Runner', description: 'Complete the Tombs of Amascut (normal) within 18 mins at any group size.', type: 'Speed', monster: 'Tombs of Amascut' },
  { index: 422, tierId: 6, name: 'Tombs Speed Runner II', description: 'Complete the Tombs of Amascut (expert) within 20 mins at any group size.', type: 'Speed', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 423, tierId: 6, name: 'Tombs Speed Runner III', description: 'Complete the Tombs of Amascut (expert) within 18 mins in a group of 8.', type: 'Speed', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 424, tierId: 5, name: 'You are not prepared', description: 'Complete a full Tombs of Amascut raid only using supplies given inside the tomb and without anyone dying.', type: 'Restriction', monster: 'Tombs of Amascut' },
  { index: 425, tierId: 4, name: 'Helpful spirit who?', description: 'Complete the Tombs of Amascut without using any supplies from the Helpful Spirit and without anyone dying. Honey locusts are included in this restriction.', type: 'Restriction', monster: 'Tombs of Amascut' },
  { index: 426, tierId: 5, name: 'Resourceful Raider', description: 'Complete the Tombs of Amascut with the "On a diet" and "Dehydration" invocations activated and without anyone dying.', type: 'Restriction', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 427, tierId: 5, name: 'But... Damage', description: 'Complete the Tombs of Amascut without anyone in your party wearing or holding any equipment at tier 75 or above.', type: 'Restriction', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 428, tierId: 5, name: 'Chompington', description: 'Defeat Zebak using only melee attacks and without dying yourself.', type: 'Restriction', monster: 'Tombs of Amascut' },
  { index: 429, tierId: 5, name: 'Fancy feet', description: 'Complete phase three of The Wardens in a group of two or more, using only melee attacks and without dying yourself. The \'Insanity\' invocation must be activated.', type: 'Restriction', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 430, tierId: 4, name: 'Hardcore Raiders', description: 'Complete the Tombs of Amascut in a group of two or more without anyone dying.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 431, tierId: 4, name: 'Hardcore Tombs', description: 'Complete the Tombs of Amascut solo without dying.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 432, tierId: 4, name: 'Perfect Het', description: 'Complete the Het room without taking any hits from the light beam or orbs. You must destroy the core after one exposure.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 433, tierId: 5, name: 'Perfect Akkha', description: 'Complete Akkha in a group of two or more, without anyone taking any hits from the following: Akkha\'s attacks off-prayer, Akkha\'s special attacks (orbs, memory, detonate), exploding shadow timers, orbs in the enrage phase or attacking Akkha with the wrong style. Hits for zero damage still count. You must have all Akkha invocations activated.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 434, tierId: 6, name: 'Perfection of Het', description: 'Complete \'Perfect Het\' and \'Perfect Akkha\' in a single run of the Tombs of Amascut.', type: 'Perfection', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 435, tierId: 4, name: 'Perfect Apmeken', description: 'Complete the Apmeken room in a group of two or more, without anyone allowing any dangers to trigger, standing in venom or being hit by a volatile baboon. You must complete this room in less than three minutes.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 436, tierId: 5, name: 'Perfect Ba-Ba', description: 'Defeat Ba-Ba in a group of two or more, without anyone taking any hits from the following: Ba-Ba\'s Attacks off-prayer, Ba-Ba\'s slam, rolling boulders, rubble attack or falling rocks. Hits for zero damage still count. No sarcophagi may be opened. You must have all Ba-Ba invocations activated.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 437, tierId: 6, name: 'Perfection of Apmeken', description: 'Complete \'Perfect Apmeken\' and \'Perfect Ba-Ba\' in a single run of the Tombs of Amascut.', type: 'Perfection', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 438, tierId: 4, name: 'Perfect Crondis', description: 'Complete the Crondis room without letting a crocodile get to the tree, without anyone losing water from their container and in under one minute.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 439, tierId: 5, name: 'Perfect Zebak', description: 'Defeat Zebak without anyone taking any hits from: poison, Zebak\'s basic attacks off-prayer, blood spawns and waves. You also must not push more than two jugs on the roar attack during the fight (you may destroy stationary ones). Hits for zero damage still count. You must have all Zebak invocations activated.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 440, tierId: 6, name: 'Perfection of Crondis', description: 'Complete \'Perfect Crondis\' and \'Perfect Zebak\' in a single run of the Tombs of Amascut.', type: 'Perfection', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 441, tierId: 5, name: 'Perfect Scabaras', description: 'Complete the Scabaras room in less than a minute without anyone taking any damage from puzzles.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 442, tierId: 5, name: 'Perfect Kephri', description: 'Defeat Kephri in a group of two or more, without anyone taking any hits from the following: egg explosions, Kephri\'s attacks, Exploding Scarabs, Bodyguards, dung attacks. Hits for zero damage still count. No eggs may hatch throughout the fight.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 443, tierId: 6, name: 'Perfection of Scabaras', description: 'Complete \'Perfect Scabaras\' and \'Perfect Kephri\' in a single run of Tombs of Amascut.', type: 'Perfection', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 444, tierId: 5, name: 'Perfect Wardens', description: 'Defeat The Wardens in a group of two or more, without anyone taking avoidable hits from the following: Warden attacks, obelisk attacks, lightning attacks in phase three, skull attack in phase three, Demi god attacks in phase three. Hits for zero damage still count. You must have all Wardens invocations activated.', type: 'Perfection', monster: 'Tombs of Amascut' },
  { index: 445, tierId: 6, name: 'Insanity', description: 'Complete \'Perfect Wardens\' at expert or above.', type: 'Perfection', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 446, tierId: 6, name: 'Amascut\'s Remnant', description: 'Complete the Tombs of Amascut at raid level 500 or above without anyone dying.', type: 'Mechanical', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 447, tierId: 5, name: 'Something of an expert myself', description: 'Complete the Tombs of Amascut raid at level 350 or above without anyone dying.', type: 'Mechanical', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 448, tierId: 6, name: 'Maybe I\'m the boss.', description: 'Complete a Tombs of Amascut raid with every single boss invocation activated and without anyone dying.', type: 'Mechanical', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 449, tierId: 4, name: 'Dropped the ball', description: 'Defeat Akkha without dropping any materialising orbs and without dying yourself.', type: 'Mechanical', monster: 'Tombs of Amascut' },
  { index: 450, tierId: 6, name: 'Akkhan\'t Do it', description: 'Defeat Akkha with all Akkha invocations activated and the path levelled up to at least four, without dying yourself.', type: 'Mechanical', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 451, tierId: 4, name: 'No skipping allowed', description: 'Defeat Ba-Ba after only attacking the non-weakened boulders in the rolling boulder phase, without dying yourself. The Boulderdash invocation must be activated.', type: 'Mechanical', monster: 'Tombs of Amascut' },
  { index: 452, tierId: 4, name: 'I\'m in a rush', description: 'Defeat Ba-Ba after destroying four or fewer rolling boulders in total without dying yourself.', type: 'Mechanical', monster: 'Tombs of Amascut' },
  { index: 453, tierId: 5, name: 'Ba-Bananza', description: 'Defeat Ba-Ba with all Ba-Ba invocations activated and the path levelled up to at least four, without dying yourself.', type: 'Mechanical', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 454, tierId: 6, name: 'All Praise Zebak', description: 'Defeat Zebak without losing a single prayer point. You must also meet the conditions of the \'Rockin\' Around The Croc\' achievement.', type: 'Mechanical', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 455, tierId: 5, name: 'Rockin\' around the croc', description: 'Defeat Zebak with all Zebak invocations activated and the path levelled up to at least four, without dying yourself.', type: 'Mechanical', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 456, tierId: 5, name: 'Doesn\'t bug me', description: 'Defeat Kephri with all Kephri invocations activated and the path levelled up to at least four, without dying yourself.', type: 'Mechanical', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 457, tierId: 5, name: 'All out of medics', description: 'Defeat Kephri without letting her heal above 25% after the first down. The \'Medic\' invocation must be activated. You must do this without dying yourself.', type: 'Mechanical', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 458, tierId: 4, name: 'Down Do Specs', description: 'Defeat the Wardens after staggering the boss a maximum of twice during phase two, without dying yourself.', type: 'Mechanical', monster: 'Tombs of Amascut' },
  { index: 459, tierId: 5, name: 'Better get movin\'', description: 'Defeat Elidinis\' Warden in phase three of the Wardens fight with \'Aerial Assault\', \'Stay vigilant\' and \'Insanity\' invocations activated and without dying yourself.', type: 'Mechanical', monster: 'Tombs of Amascut' },
  { index: 460, tierId: 5, name: 'Warden\'t you believe it', description: 'Defeat the Wardens with all Wardens invocations activated, at expert level and without dying yourself.', type: 'Mechanical', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 461, tierId: 3, name: 'Novice Tomb Explorer', description: 'Complete the Tombs of Amascut in Entry mode (or above) once.', type: 'Kill Count', monster: 'Tombs of Amascut: Entry Mode' },
  { index: 462, tierId: 3, name: 'Novice Tomb Looter', description: 'Complete the Tombs of Amascut in Entry mode (or above) 25 times.', type: 'Kill Count', monster: 'Tombs of Amascut: Entry Mode' },
  { index: 463, tierId: 4, name: 'Novice Tomb Raider', description: 'Complete the Tombs of Amascut in Entry mode (or above) 50 times.', type: 'Kill Count', monster: 'Tombs of Amascut: Entry Mode' },
  { index: 464, tierId: 3, name: 'Movin\' on up', description: 'Complete a Tombs of Amascut raid at level 50 or above.', type: 'Restriction', monster: 'Tombs of Amascut: Entry Mode' },
  { index: 465, tierId: 3, name: 'Confident Raider', description: 'Complete a Tombs of Amascut raid at level 100 or above.', type: 'Restriction', monster: 'Tombs of Amascut: Entry Mode' },
  { index: 466, tierId: 5, name: 'Tomb Looter', description: 'Complete the Tombs of Amascut 25 times.', type: 'Kill Count', monster: 'Tombs of Amascut' },
  { index: 467, tierId: 5, name: 'Tomb Raider', description: 'Complete the Tombs of Amascut 50 times.', type: 'Kill Count', monster: 'Tombs of Amascut' },
  { index: 468, tierId: 4, name: 'Tomb Explorer', description: 'Complete the Tombs of Amascut once.', type: 'Kill Count', monster: 'Tombs of Amascut' },
  { index: 469, tierId: 4, name: 'Expert Tomb Explorer', description: 'Complete the Tombs of Amascut (Expert mode) once.', type: 'Kill Count', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 470, tierId: 5, name: 'Expert Tomb Looter', description: 'Complete the Tombs of Amascut (Expert mode) 25 times.', type: 'Kill Count', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 471, tierId: 6, name: 'Expert Tomb Raider', description: 'Complete the Tombs of Amascut (Expert mode) 50 times.', type: 'Kill Count', monster: 'Tombs of Amascut: Expert Mode' },
  { index: 472, tierId: 5, name: 'More than just a ranged weapon', description: 'Kill the Phantom Muspah by only dealing damage to it with a salamander.', type: 'Restriction', monster: 'Phantom Muspah' },
  { index: 473, tierId: 4, name: 'Can\'t Escape', description: 'Kill the Phantom Muspah without running.', type: 'Restriction', monster: 'Phantom Muspah' },
  { index: 474, tierId: 5, name: 'Essence Farmer', description: 'Kill the Phantom Muspah 10 times in one trip.', type: 'Stamina', monster: 'Phantom Muspah' },
  { index: 475, tierId: 4, name: 'Phantom Muspah Speed-Trialist', description: 'Kill the Phantom Muspah in less than 3 minutes without a slayer task.', type: 'Speed', monster: 'Phantom Muspah' },
  { index: 476, tierId: 5, name: 'Phantom Muspah Speed-Chaser', description: 'Kill the Phantom Muspah in less than 2 minutes without a slayer task.', type: 'Speed', monster: 'Phantom Muspah' },
  { index: 477, tierId: 6, name: 'Phantom Muspah Speed-Runner', description: 'Kill the Phantom Muspah in less than 1 minute and 30 seconds without a slayer task.', type: 'Speed', monster: 'Phantom Muspah' },
  { index: 478, tierId: 3, name: 'Phantom Muspah Adept', description: 'Kill the Phantom Muspah.', type: 'Kill Count', monster: 'Phantom Muspah' },
  { index: 479, tierId: 4, name: 'Phantom Muspah Veteran', description: 'Kill the Phantom Muspah 25 times.', type: 'Kill Count', monster: 'Phantom Muspah' },
  { index: 480, tierId: 5, name: 'Phantom Muspah Master', description: 'Kill the Phantom Muspah 50 times.', type: 'Kill Count', monster: 'Phantom Muspah' },
  { index: 481, tierId: 5, name: 'Space is Tight', description: 'Kill the Phantom Muspah whilst it is surrounded by spikes.', type: 'Mechanical', monster: 'Phantom Muspah' },
  { index: 482, tierId: 4, name: 'Versatile Drainer', description: 'Drain the Phantom Muspah\'s Prayer with three different sources in one kill.', type: 'Mechanical', monster: 'Phantom Muspah' },
  { index: 483, tierId: 5, name: 'Walk Straight Pray True', description: 'Kill the Phantom Muspah without taking any avoidable damage.', type: 'Perfection', monster: 'Phantom Muspah' },
  { index: 484, tierId: 6, name: 'Phantom Muspah Manipulator', description: 'Kill the Phantom Muspah whilst completing Walk Straight Pray True, Space is Tight & Can\'t Escape.', type: 'Perfection', monster: 'Phantom Muspah' },
  { index: 485, tierId: 4, name: 'Vardorvis Speed-Trialist', description: 'Kill Vardorvis in less than 1:15 minutes without a slayer task.', type: 'Speed', monster: 'Vardorvis' },
  { index: 486, tierId: 5, name: 'Vardorvis Speed-Chaser', description: 'Kill Vardorvis in less than 1:05 without a slayer task.', type: 'Speed', monster: 'Vardorvis' },
  { index: 487, tierId: 6, name: 'Vardorvis Speed-Runner', description: 'Kill Vardorvis in less than 0:55 without a slayer task.', type: 'Speed', monster: 'Vardorvis' },
  { index: 488, tierId: 4, name: 'Vardorvis Adept', description: 'Kill Vardorvis once.', type: 'Kill Count', monster: 'Vardorvis' },
  { index: 489, tierId: 5, name: 'Vardorvis Master', description: 'Kill Vardorvis 50 times.', type: 'Kill Count', monster: 'Vardorvis' },
  { index: 490, tierId: 6, name: 'Vardorvis Sleeper', description: 'Kill Awakened Vardorvis.', type: 'Kill Count', monster: 'Vardorvis' },
  { index: 491, tierId: 5, name: 'Perfect Vardorvis', description: 'Kill Vardorvis perfectly 5 times without leaving.', type: 'Perfection', monster: 'Vardorvis' },
  { index: 492, tierId: 6, name: 'Axe Enthusiast', description: 'Kill Vardorvis after surviving for 3 minutes of Vardorvis\' max speed, and never leaving the centre 25 tiles.', type: 'Mechanical', monster: 'Vardorvis' },
  { index: 493, tierId: 5, name: 'Budget Cutter', description: 'Kill Vardorvis with gear worth 2m or less in total.', type: 'Restriction', monster: 'Vardorvis' },
  { index: 494, tierId: 4, name: 'Whisperer Speed-Trialist', description: 'Kill the Whisperer in less than 3:00 without a slayer task.', type: 'Speed', monster: 'The Whisperer' },
  { index: 495, tierId: 5, name: 'Whisperer Speed-Chaser', description: 'Kill the Whisperer in less than 2:25 without a slayer task.', type: 'Speed', monster: 'The Whisperer' },
  { index: 496, tierId: 6, name: 'Whisperer Speed-Runner', description: 'Kill the Whisperer in less than 2:05 without a slayer task.', type: 'Speed', monster: 'The Whisperer' },
  { index: 497, tierId: 4, name: 'Whisperer Adept', description: 'Kill the Whisperer once.', type: 'Kill Count', monster: 'The Whisperer' },
  { index: 498, tierId: 5, name: 'Whisperer Master', description: 'Kill the Whisperer 50 times.', type: 'Kill Count', monster: 'The Whisperer' },
  { index: 499, tierId: 6, name: 'Whispered', description: 'Kill the Awakened Whisperer.', type: 'Kill Count', monster: 'The Whisperer' },
  { index: 500, tierId: 5, name: 'Perfect Whisperer', description: 'Kill the Whisperer without taking avoidable damage 5 times without leaving.', type: 'Perfection', monster: 'The Whisperer' },
  { index: 501, tierId: 4, name: 'Tentacular', description: 'Kill the Whisperer whilst only being on the Arceuus spellbook.', type: 'Restriction', monster: 'The Whisperer' },
  { index: 502, tierId: 6, name: 'Dark Memories', description: 'Kill the Whisperer whilst spending less than 6 seconds in the pre-enrage shadow realm.', type: 'Restriction', monster: 'The Whisperer' },
  { index: 503, tierId: 4, name: 'Leviathan Speed-Trialist', description: 'Kill the Leviathan in less than 1:50 without a slayer task.', type: 'Speed', monster: 'The Leviathan' },
  { index: 504, tierId: 5, name: 'Leviathan Speed-Chaser', description: 'Kill the Leviathan in less than 1:25 without a slayer task.', type: 'Speed', monster: 'The Leviathan' },
  { index: 505, tierId: 6, name: 'Leviathan Speed-Runner', description: 'Kill the Leviathan in less than 1:10 without a slayer task.', type: 'Speed', monster: 'The Leviathan' },
  { index: 506, tierId: 4, name: 'Leviathan Adept', description: 'Kill the Leviathan once.', type: 'Kill Count', monster: 'The Leviathan' },
  { index: 507, tierId: 5, name: 'Leviathan Master', description: 'Kill the Leviathan 50 times.', type: 'Kill Count', monster: 'The Leviathan' },
  { index: 508, tierId: 6, name: 'Leviathan Sleeper', description: 'Kill the Awakened Leviathan.', type: 'Kill Count', monster: 'The Leviathan' },
  { index: 509, tierId: 5, name: 'Perfect Leviathan', description: 'Kill the Leviathan perfectly 5 times without leaving.', type: 'Perfection', monster: 'The Leviathan' },
  { index: 510, tierId: 5, name: 'Serpentine Solo', description: 'Kill the Leviathan without stunning the boss more than once.', type: 'Mechanical', monster: 'The Leviathan' },
  { index: 511, tierId: 6, name: 'Unconventional', description: 'Kill the Leviathan using only Mithril ammunition whilst having no more than 25 Hitpoints throughout the entire fight.', type: 'Restriction', monster: 'The Leviathan' },
  { index: 512, tierId: 4, name: 'Duke Sucellus Speed-Trialist', description: 'Kill Duke Sucellus in less than 1:00 minutes without a slayer task.', type: 'Speed', monster: 'Duke Sucellus' },
  { index: 513, tierId: 5, name: 'Duke Sucellus Speed-Chaser', description: 'Kill Duke Sucellus in less than 50 seconds without a slayer task.', type: 'Speed', monster: 'Duke Sucellus' },
  { index: 514, tierId: 6, name: 'Duke Sucellus Speed-Runner', description: 'Kill Duke Sucellus in less than 40 seconds without a slayer task.', type: 'Speed', monster: 'Duke Sucellus' },
  { index: 515, tierId: 4, name: 'Duke Sucellus Adept', description: 'Kill Duke Sucellus once.', type: 'Kill Count', monster: 'Duke Sucellus' },
  { index: 516, tierId: 5, name: 'Duke Sucellus Master', description: 'Kill Duke Sucellus 50 times.', type: 'Kill Count', monster: 'Duke Sucellus' },
  { index: 517, tierId: 6, name: 'Duke Sucellus Sleeper', description: 'Kill Awakened Duke Sucellus.', type: 'Kill Count', monster: 'Duke Sucellus' },
  { index: 518, tierId: 5, name: 'Perfect Duke Sucellus', description: 'Kill Duke Sucellus without taking any avoidable damage 5 times without leaving.', type: 'Perfection', monster: 'Duke Sucellus' },
  { index: 519, tierId: 5, name: 'Cold Feet', description: 'Kill Duke Sucellus without taking any avoidable damage, whilst also never running.', type: 'Restriction', monster: 'Duke Sucellus' },
  { index: 520, tierId: 6, name: 'Mirror Image', description: 'Kill Duke Sucellus whilst only attacking the boss on the same tick Duke attacks you.', type: 'Restriction', monster: 'Duke Sucellus' },
  { index: 521, tierId: 1, name: 'Scurrius Novice', description: 'Kill Scurrius once.', type: 'Kill Count', monster: 'Scurrius' },
  { index: 522, tierId: 2, name: 'Scurrius Champion', description: 'Kill Scurrius 10 times.', type: 'Kill Count', monster: 'Scurrius' },
  { index: 523, tierId: 1, name: 'Sit Rat', description: 'Finish off Scurrius with a ratbane weapon in a private instance.', type: 'Restriction', monster: 'Scurrius' },
  { index: 524, tierId: 2, name: 'Perfect Scurrius', description: 'Kill Scurrius in a private instance without taking damage from the following attacks: Tail Swipe and Falling Bricks. Pray correctly against the following attacks: Flying Fur and Bolts of Electricity.', type: 'Perfection', monster: 'Scurrius' },
  { index: 525, tierId: 2, name: 'Efficient Pest Control', description: 'Kill 6 Giant Rats within Scurrius\' lair in 3 seconds.', type: 'Mechanical', monster: 'Scurrius' },
  { index: 526, tierId: 3, name: 'The Clone Zone', description: 'Defeat the Eclipse moon by only attacking its clones.', type: 'Mechanical', monster: 'Moons of Peril' },
  { index: 527, tierId: 4, name: 'High Hitter', description: 'Defeat a Moon before they start their second special attack.', type: 'Mechanical', monster: 'Moons of Peril' },
  { index: 528, tierId: 2, name: 'Lunar Triplet', description: 'Open the Reward Chest after defeating all three Moons.', type: 'Kill Count', monster: 'Moons of Peril' },
  { index: 529, tierId: 2, name: 'Perilous Novice', description: 'Open the Reward Chest 5 times.', type: 'Kill Count', monster: 'Moons of Peril' },
  { index: 530, tierId: 3, name: 'Perilous Champion', description: 'Open the Reward Chest 25 times.', type: 'Kill Count', monster: 'Moons of Peril' },
  { index: 531, tierId: 3, name: 'Perilous Dancer', description: 'Defeat all the Moons in one run while only taking damage from regular attacks.', type: 'Perfection', monster: 'Moons of Peril' },
  { index: 532, tierId: 3, name: 'Fortified', description: 'Defeat a Moon without consuming any supplies.', type: 'Restriction', monster: 'Moons of Peril' },
  { index: 533, tierId: 3, name: 'Betrayal', description: 'Defeat a Moon using its associated weapon drop.', type: 'Restriction', monster: 'Moons of Peril' },
  { index: 534, tierId: 2, name: 'Back to Our Roots', description: 'Defeat all three Moons in one run by only attacking with a Dragon Scimitar.', type: 'Restriction', monster: 'Moons of Peril' },
  { index: 535, tierId: 2, name: 'Moons of Peril Speed-Trialist', description: 'Defeat all three Moons in one run in under 8 minutes.', type: 'Speed', monster: 'Moons of Peril' },
  { index: 536, tierId: 3, name: 'Moons of Peril Speed-Chaser', description: 'Defeat all three Moons in one run in under 6 minutes.', type: 'Speed', monster: 'Moons of Peril' },
  { index: 537, tierId: 3, name: 'Fat of the Land', description: 'Defeat 30 Moons of Peril bosses without leaving the dungeon.', type: 'Stamina', monster: 'Moons of Peril' },
  { index: 538, tierId: 5, name: 'Sportsmanship', description: 'Defeat Sol Heredit once.', type: 'Kill Count', monster: 'Fortis Colosseum' },
  { index: 539, tierId: 6, name: 'Colosseum Grand Champion', description: 'Defeat Sol Heredit 10 times.', type: 'Kill Count', monster: 'Fortis Colosseum' },
  { index: 540, tierId: 5, name: 'I Brought Mine Too', description: 'Defeat Sol Heredit using only a Spear, Hasta or Halberd.', type: 'Restriction', monster: 'Fortis Colosseum' },
  { index: 541, tierId: 6, name: 'Slow Dancing in the Sand', description: 'Defeat Sol Heredit without running during the fight with him.', type: 'Restriction', monster: 'Fortis Colosseum' },
  { index: 542, tierId: 4, name: 'Furball', description: 'Complete Wave 4 without taking avoidable damage from a Manticore.', type: 'Perfection', monster: 'Fortis Colosseum' },
  { index: 543, tierId: 6, name: 'Perfect Footwork', description: 'Defeat Sol Heredit without taking any damage from his Spear, Shield, Grapple or Triple Attack.', type: 'Perfection', monster: 'Fortis Colosseum' },
  { index: 544, tierId: 5, name: 'Showboating', description: 'Defeat Sol Heredit after Fortis Saluting to the North, East, South and West of the arena while he\'s below 10% Hitpoints.', type: 'Mechanical', monster: 'Fortis Colosseum' },
  { index: 545, tierId: 4, name: 'Denied', description: 'Complete Wave 7 without the Minotaur ever healing other enemies.', type: 'Mechanical', monster: 'Fortis Colosseum' },
  { index: 546, tierId: 5, name: 'One-off', description: 'Complete Wave 11 with either "Red Flag", "Dynamic Duo", or "Doom II" active.', type: 'Mechanical', monster: 'Fortis Colosseum' },
  { index: 547, tierId: 6, name: 'Reinforcements', description: 'Defeat Sol Heredit with the "Bees! II", "Quartet", and "Solarflare II" modifiers active.', type: 'Mechanical', monster: 'Fortis Colosseum' },
  { index: 548, tierId: 4, name: 'I was here first!', description: 'Kill a Jaguar Warrior using a Claw-type weapon special attack.', type: 'Mechanical', monster: 'Fortis Colosseum' },
  { index: 549, tierId: 5, name: 'Colosseum Speed-Chaser', description: 'Complete the Colosseum with a total time of 28:00 or less.', type: 'Speed', monster: 'Fortis Colosseum' },
  { index: 550, tierId: 6, name: 'Colosseum Speed-Runner', description: 'Complete the Colosseum with a total time of 24:00 or less.', type: 'Speed', monster: 'Fortis Colosseum' },
  { index: 551, tierId: 4, name: 'Unending Torment', description: 'Kill a Tormented Demon.', type: 'Kill Count', monster: 'Tormented Demon' },
  { index: 552, tierId: 4, name: 'Through Fire and Flames', description: 'Kill a Tormented Demon whilst their shield is inactive.', type: 'Restriction', monster: 'Tormented Demon' },
  { index: 553, tierId: 4, name: 'Two Times the Torment', description: 'Kill two Tormented Demons within 2 seconds.', type: 'Restriction', monster: 'Tormented Demon' },
  { index: 554, tierId: 5, name: 'Three Times the Thrashing', description: 'Kill three Tormented Demons within 3 seconds.', type: 'Restriction', monster: 'Tormented Demon' },
  { index: 555, tierId: 4, name: 'Rapid Reload', description: 'Hit three Tormented Demons within 3 seconds using a ballista or a crossbow.', type: 'Mechanical', monster: 'Tormented Demon' },
  { index: 556, tierId: 4, name: 'Araxxor Veteran', description: 'Kill Araxxor 25 times.', type: 'Kill Count', monster: 'Araxxor' },
  { index: 557, tierId: 5, name: 'Araxxor Master', description: 'Kill Araxxor 75 times.', type: 'Kill Count', monster: 'Araxxor' },
  { index: 558, tierId: 4, name: 'Araxxor Speed-Trialist', description: 'Kill Araxxor 4 times in 10:00.', type: 'Speed', monster: 'Araxxor' },
  { index: 559, tierId: 5, name: 'Araxxor Speed-Chaser', description: 'Kill Araxxor 5 times in 10:00.', type: 'Speed', monster: 'Araxxor' },
  { index: 560, tierId: 6, name: 'Araxxor Speed-Runner', description: 'Kill Araxxor 6 times in 10:00.', type: 'Speed', monster: 'Araxxor' },
  { index: 561, tierId: 5, name: 'Perfect Araxxor', description: 'Kill Araxxor perfectly, without taking damage from Araxxor\'s Mage & Range attacks, melee attack off prayer, araxyte minions damage, or damage from acid pools.', type: 'Perfection', monster: 'Araxxor' },
  { index: 562, tierId: 6, name: 'Perfect Araxxor 2', description: 'Kill Araxxor perfectly, without hitting it during the enrage phase.', type: 'Perfection', monster: 'Araxxor' },
  { index: 563, tierId: 5, name: 'Let it seep in', description: 'Kill Araxxor without ever having venom or poison immunity.', type: 'Restriction', monster: 'Araxxor' },
  { index: 564, tierId: 4, name: 'Relaxxor', description: 'Kill Araxxor after destroying six eggs.', type: 'Restriction', monster: 'Araxxor' },
  { index: 565, tierId: 6, name: 'Swimming in Venom', description: 'Kill Araxxor without the boss ever moving.', type: 'Restriction', monster: 'Araxxor' },
  { index: 566, tierId: 5, name: 'Araxyte Betrayal', description: 'Have an Araxyte kill three other Araxytes.', type: 'Mechanical', monster: 'Araxxor' },
  { index: 567, tierId: 5, name: 'Arachnid Lover', description: 'Kill Araxxor 10 times without leaving.', type: 'Stamina', monster: 'Araxxor' },
  { index: 568, tierId: 2, name: 'Hueycoatl Champion', description: 'Kill the Hueycoatl once.', type: 'Kill Count', monster: 'The Hueycoatl' },
  { index: 569, tierId: 3, name: 'Hueycoatl Adept', description: 'Kill the Hueycoatl 10 times.', type: 'Kill Count', monster: 'The Hueycoatl' },
  { index: 570, tierId: 4, name: 'Hueycoatl Veteran', description: 'Kill the Hueycoatl 25 times.', type: 'Kill Count', monster: 'The Hueycoatl' },
  { index: 571, tierId: 4, name: 'Perfect Hueycoatl', description: 'Kill the Hueycoatl perfectly 5 times without leaving. To get a perfect kill, you must not take any avoidable damage from the Hueycoatl\'s lightning attack, tail slam attack or off-prayer projectile attacks.', type: 'Perfection', monster: 'The Hueycoatl' },
  { index: 572, tierId: 3, name: 'Pillar Lover', description: 'Kill the Hueycoatl whilst it is vulnerable.', type: 'Mechanical', monster: 'The Hueycoatl' },
  { index: 573, tierId: 5, name: 'Is it a bird?', description: 'Kill the Hueycoatl using only dragonbane weaponry.', type: 'Restriction', monster: 'The Hueycoatl' },
  { index: 574, tierId: 2, name: 'You\'re a wizard', description: 'Kill the Hueycoatl using only earth spells.', type: 'Restriction', monster: 'The Hueycoatl' },
  { index: 575, tierId: 3, name: 'I\'m your son', description: 'Kill the Hueycoatl whilst wearing two pieces of Hueycoatl armour.', type: 'Restriction', monster: 'The Hueycoatl' },
  { index: 576, tierId: 4, name: 'Hueycoatl Speed-Trialist', description: 'Kill the Hueycoatl in 2:30', type: 'Speed', monster: 'The Hueycoatl' },
  { index: 577, tierId: 5, name: 'Hueycoatl Speed-Chaser', description: 'Kill the Hueycoatl in 2:30 with five or fewer players.', type: 'Speed', monster: 'The Hueycoatl' },
  { index: 578, tierId: 6, name: 'Hueycoatl Speed-Runner', description: 'Kill the Hueycoatl in 2:30 with three or fewer players.', type: 'Speed', monster: 'The Hueycoatl' },
  { index: 579, tierId: 2, name: 'Amoxliatl Champion', description: 'Kill Amoxliatl once.', type: 'Kill Count', monster: 'Amoxliatl' },
  { index: 580, tierId: 3, name: 'Amoxliatl Adept', description: 'Kill Amoxliatl 20 times.', type: 'Kill Count', monster: 'Amoxliatl' },
  { index: 581, tierId: 3, name: 'Amoxliatl Speed-Trialist', description: 'Kill Amoxliatl in less than 1 minute.', type: 'Speed', monster: 'Amoxliatl' },
  { index: 582, tierId: 4, name: 'Amoxliatl Speed-Chaser', description: 'Kill Amoxliatl in less than 30 seconds.', type: 'Speed', monster: 'Amoxliatl' },
  { index: 583, tierId: 3, name: 'Nagua Negation', description: 'Kill Amoxliatl without taking any damage.', type: 'Perfection', monster: 'Amoxliatl' },
  { index: 584, tierId: 2, name: 'Temotli Triumph', description: 'Kill Amoxliatl using only glacial temotli as a weapon.', type: 'Restriction', monster: 'Amoxliatl' },
  { index: 585, tierId: 4, name: 'Without Ralos\' Light', description: 'Kill Amoxliatl without losing any prayer points.', type: 'Restriction', monster: 'Amoxliatl' },
  { index: 586, tierId: 3, name: 'Kemo Makti', description: 'Kill Amoxliatl 10 times without leaving her chamber.', type: 'Stamina', monster: 'Amoxliatl' },
  { index: 587, tierId: 3, name: 'Totally Shattered', description: 'Kill Amoxliatl without any of her unstable ice shattering.', type: 'Mechanical', monster: 'Amoxliatl' },
  { index: 588, tierId: 3, name: 'Perfect Royal Titans', description: 'Kill the Royal Titans without taking any avoidable damage. This includes damage from any melee attacks, explosions from the ice elemental or fire elemental, any icicle or fire spawn, any jump attacks or the ice or fire pulse attack.', type: 'Perfection', monster: 'Royal Titans' },
  { index: 589, tierId: 2, name: 'Royal Titan Champion', description: 'Kill the Royal Titans 10 times.', type: 'Kill Count', monster: 'Royal Titans' },
  { index: 590, tierId: 2, name: 'Royal Titan Adept', description: 'Kill the Royal Titans 25 times.', type: 'Kill Count', monster: 'Royal Titans' },
  { index: 591, tierId: 1, name: 'One by one', description: 'Kill one Titan at a time, without attacking the other.', type: 'Restriction', monster: 'Royal Titans' },
  { index: 592, tierId: 3, name: 'Royal Titan Speed-Runner', description: 'Kill the Royal Titans in less than 1:30 minutes.', type: 'Speed', monster: 'Royal Titans' },
  { index: 593, tierId: 3, name: 'Titan Killer', description: 'Kill the Royal Titans 15 times without leaving the area. If a player joins the fight, the current streak will be reset to 0. If a player leaves the fight, the task will be failed and a new instance will need to be created.', type: 'Stamina', monster: 'Royal Titans' },
  { index: 594, tierId: 1, name: 'Elemental Company', description: 'Kill the Royal Titans without attacking any elementals.', type: 'Restriction', monster: 'Royal Titans' },
  { index: 595, tierId: 3, name: 'I need room', description: 'Kill the Royal Titans while extinguishing all fires and melting all icicles before they dissipate naturally.', type: 'Restriction', monster: 'Royal Titans' },
  { index: 596, tierId: 4, name: 'No time to pray', description: 'Kill the Royal Titans without losing any prayer points.', type: 'Restriction', monster: 'Royal Titans' },
  { index: 597, tierId: 1, name: 'Let them fight', description: 'Kill the Royal Titans while having them kill a total of 10 elementals.', type: 'Restriction', monster: 'Royal Titans' },
  { index: 598, tierId: 2, name: 'It takes too long', description: 'Kill both royal titans while they are charging up their area attack. Both titans must die during the same charging up phase.', type: 'Mechanical', monster: 'Royal Titans' },
  { index: 599, tierId: 4, name: 'Yama Adept', description: 'Defeat Yama once.', type: 'Kill Count', monster: 'Yama' },
  { index: 600, tierId: 5, name: 'Yama Veteran', description: 'Defeat Yama 50 times.', type: 'Kill Count', monster: 'Yama' },
  { index: 601, tierId: 4, name: 'Yama Speed-Trialist', description: 'Defeat Yama in an average time of under 3:38 over your last four kills.', type: 'Speed', monster: 'Yama' },
  { index: 602, tierId: 5, name: 'Yama Speed-Chaser', description: 'Defeat Yama in an average time of under 3:00 over your last four kills.', type: 'Speed', monster: 'Yama' },
  { index: 603, tierId: 6, name: 'Yama Speed-Runner', description: 'Defeat Yama in an average time of under 2:34 over your last four kills.', type: 'Speed', monster: 'Yama' },
  { index: 604, tierId: 5, name: 'No toppings, no drinks, thanks', description: 'Defeat Yama without anybody healing using anything other than plain pizza and without anybody drinking any potions.', type: 'Restriction', monster: 'Yama' },
  { index: 605, tierId: 5, name: 'Shadow dancer', description: 'Defeat Yama without getting hit by shadows and without being more than one tile away from the center of his shadow crash attack.', type: 'Mechanical', monster: 'Yama' },
  { index: 606, tierId: 5, name: 'Fire fighter', description: 'Defeat Yama without getting hit by fire and having only killed void flares with special attacks.', type: 'Mechanical', monster: 'Yama' },
  { index: 607, tierId: 4, name: 'Back so soon?', description: 'Defeat Yama without the judge being attacked with the wrong style and without taking more than one instance of damage each time you are exiled from the arena.', type: 'Mechanical', monster: 'Yama' },
  { index: 608, tierId: 6, name: 'Contract Choreographer', description: 'Defeat Yama whilst completing \'Shadow Dancer\', \'Fire Fighter\', \'Back so soon?\' and without taking any other avoidable damage.', type: 'Perfection', monster: 'Yama' },
  { index: 609, tierId: 6, name: 'Contractually Unbound', description: 'Defeat Yama under the elevated conditions of one of his non-standard contracts.', type: 'Kill Count', monster: 'Yama' },
  { index: 610, tierId: 4, name: 'Doom Adept', description: 'Defeat the Doom of Mokhaiotl at delve level 3.', type: 'Kill Count', monster: 'Doom of Mokhaiotl' },
  { index: 611, tierId: 5, name: 'Doom Veteran', description: 'Defeat the Doom of Mokhaiotl at delve level 8.', type: 'Kill Count', monster: 'Doom of Mokhaiotl' },
  { index: 612, tierId: 6, name: 'It\'s Dark Down Here', description: 'Defeat the Doom of Mokhaiotl at delve level 16.', type: 'Stamina', monster: 'Doom of Mokhaiotl' },
  { index: 613, tierId: 4, name: 'Exposed Doom', description: 'Defeat the Doom of Mokhaiotl during its Melee charge phase.', type: 'Mechanical', monster: 'Doom of Mokhaiotl' },
  { index: 614, tierId: 5, name: 'Mokhaiotl Drift', description: 'Defeat the Doom of Mokhaiotl at level 8 or above before he finishes the first burrow phase.', type: 'Mechanical', monster: 'Doom of Mokhaiotl' },
  { index: 615, tierId: 5, name: 'Grub Patrol', description: 'Defeat the Doom of Mokhaiotl levels 1-8 without ever letting a grub be absorbed.', type: 'Mechanical', monster: 'Doom of Mokhaiotl' },
  { index: 616, tierId: 6, name: 'Perfect Doom', description: 'Defeat the Doom of Mokhaiotl levels 1-8 without taking any damage from the boss, letting any grubs be absorbed, or stepping in acid blood.', type: 'Perfection', monster: 'Doom of Mokhaiotl' },
  { index: 617, tierId: 6, name: 'The Praying Mantis', description: 'Defeat the Doom of Mokhaiotl levels 1-8 without restoring your prayer points through any method.', type: 'Restriction', monster: 'Doom of Mokhaiotl' },
  { index: 618, tierId: 6, name: 'Duel of Mokhaiotl', description: 'Defeat the Doom of Mokhaiotl levels 1-8 whilst only damaging the boss with one-handed melee attacks.', type: 'Restriction', monster: 'Doom of Mokhaiotl' },
  { index: 619, tierId: 6, name: 'Darkness Is Your Ally?', description: 'Defeat the Doom of Mokhaiotl levels 1-8 without equipping a demonbane weapon.', type: 'Restriction', monster: 'Doom of Mokhaiotl' },
  { index: 620, tierId: 5, name: 'Mine\'s Better', description: 'Defeat the Doom of Mokhaiotl levels 1-8 whilst always wearing a shield.', type: 'Restriction', monster: 'Doom of Mokhaiotl' },
  { index: 621, tierId: 4, name: 'Doom Crawler', description: 'Defeat the Doom of Mokhaiotl level 1 in less than 30 seconds.', type: 'Speed', monster: 'Doom of Mokhaiotl' },
  { index: 622, tierId: 5, name: 'Doom Chaser', description: 'Defeat the Doom of Mokhaiotl levels 1-8 in less than 10:00.', type: 'Speed', monster: 'Doom of Mokhaiotl' },
  { index: 623, tierId: 6, name: 'Doom Racer', description: 'Defeat the Doom of Mokhaiotl levels 1-8 in less than 7:15.', type: 'Speed', monster: 'Doom of Mokhaiotl' },
  { index: 624, tierId: 6, name: 'Mopping up', description: 'Clear at least 8 acid splats in a single Volatile Earth special attack.', type: 'Mechanical', monster: 'Doom of Mokhaiotl' },
  { index: 625, tierId: 1, name: 'Shellbane Adept', description: 'Kill the Shellbane Gryphon 25 times.', type: 'Kill Count', monster: 'Shellbane Gryphon' },
  { index: 626, tierId: 2, name: 'Shellbane Veteran', description: 'Kill the Shellbane Gryphon 50 times.', type: 'Kill Count', monster: 'Shellbane Gryphon' },
  { index: 627, tierId: 2, name: 'Perfect Shellbane', description: 'Kill the Shellbane Gryphon without taking damage.', type: 'Perfection', monster: 'Shellbane Gryphon' },
  { index: 628, tierId: 2, name: 'Shellbane Speedrunner', description: 'Kill the Shellbane Gryphon 10 times within 12:30 minutes of entering the cave.', type: 'Speed', monster: 'Shellbane Gryphon' },
  { index: 629, tierId: 3, name: 'Shellbane Survivor', description: 'Kill the Shellbane Gryphon 25 times without leaving the cave.', type: 'Stamina', monster: 'Shellbane Gryphon' },
  { index: 630, tierId: 1, name: 'Dry Cleaning', description: 'Kill the Shellbane Gryphon after clearing its corrosive spit from your armour.', type: 'Mechanical', monster: 'Shellbane Gryphon' },
  { index: 631, tierId: 3, name: 'Featherweight Fighter', description: 'Kill the Shellbane Gryphon 5 times without leaving the cave, while wearing gear weighing less than 40kg.', type: 'Restriction', monster: 'Shellbane Gryphon' },
  { index: 632, tierId: 1, name: 'Brutus Novice', description: 'Kill Brutus.', type: 'Kill Count', monster: 'Brutus' },
  { index: 633, tierId: 2, name: 'Brutus Champion', description: 'Kill Brutus 10 times.', type: 'Kill Count', monster: 'Brutus' },
  { index: 634, tierId: 4, name: 'Brutus Speed-Trialist', description: 'Kill Brutus in less than 2 seconds.', type: 'Speed', monster: 'Brutus' },
  { index: 635, tierId: 2, name: 'Beef vs Beef', description: 'Kill Brutus whilst neither equipping nor consuming anything.', type: 'Perfection', monster: 'Brutus' },
  { index: 636, tierId: 3, name: 'Smarter than a Cow', description: 'Kill Brutus without being attacked.', type: 'Mechanical', monster: 'Brutus' },
] as const;

// Cumulative point thresholds to reach each tier reward, derived from task list
export const COMBAT_ACHIEVEMENT_TIER_THRESHOLDS: ReadonlyArray<{
  id: number;
  points: number;
}> = (() => {
  const pointsPerTier = new Map<number, number>();
  for (const task of COMBAT_ACHIEVEMENT_TASKS) {
    const tierPoints = COMBAT_ACHIEVEMENT_TIER_POINTS[task.tierId] ?? 0;
    pointsPerTier.set(
      task.tierId,
      (pointsPerTier.get(task.tierId) ?? 0) + tierPoints,
    );
  }

  let cumulative = 0;
  return COMBAT_ACHIEVEMENT_TIERS.map((tier) => {
    cumulative += pointsPerTier.get(tier.id) ?? 0;
    return { id: tier.id, points: cumulative };
  });
})();
