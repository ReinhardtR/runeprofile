const HISCORE_URL = (type?: string) =>
  `https://services.runescape.com/m=hiscore_oldschool${type ? `_${type}` : ""}/index_lite.json`;

export const HISCORE_ENDPOINTS = {
  Normal: HISCORE_URL(),
  Ironman: HISCORE_URL("ironman"),
  "Hardcore Ironman": HISCORE_URL("hardcore_ironman"),
  "Ultimate Ironman": HISCORE_URL("ultimate"),
  "1 Defence Pure": HISCORE_URL("skiller_defence"),
  "Level 3 Skiller": HISCORE_URL("skiller"),
} as const;

export type HiscoreEndpoint = keyof typeof HISCORE_ENDPOINTS;

export type HiscoreSkill = {
  id: number;
  name: string;
  rank: number;
  level: number;
  xp: number;
};

export type HiscoreActivity = {
  id: number;
  name: string;
  rank: number;
  score: number;
};

export type HiscoreData = {
  skills: Array<HiscoreSkill>;
  activities: Array<HiscoreActivity>;
};

export async function getHiscoresData(params: {
  username: string;
  endpoint: HiscoreEndpoint;
}): Promise<HiscoreData> {
  if (import.meta.env.DEV) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return DEV_TEST_DATA;
  }

  const url = `${HISCORE_ENDPOINTS[params.endpoint]}?player=${params.username}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch hiscore data");
  }
  const data: HiscoreData = await response.json();
  return data;
}

const DEV_TEST_DATA = {
  skills: [
    {
      id: 0,
      name: "Overall",
      rank: 7033,
      level: 2277,
      xp: 816037207,
    },
    {
      id: 1,
      name: "Attack",
      rank: 24226,
      level: 99,
      xp: 33559372,
    },
    {
      id: 2,
      name: "Defence",
      rank: 37560,
      level: 99,
      xp: 22757866,
    },
    {
      id: 3,
      name: "Strength",
      rank: 1758,
      level: 99,
      xp: 200000000,
    },
    {
      id: 4,
      name: "Hitpoints",
      rank: 3817,
      level: 99,
      xp: 148189658,
    },
    {
      id: 5,
      name: "Ranged",
      rank: 12493,
      level: 99,
      xp: 105915105,
    },
    {
      id: 6,
      name: "Prayer",
      rank: 45567,
      level: 99,
      xp: 13394439,
    },
    {
      id: 7,
      name: "Magic",
      rank: 5035,
      level: 99,
      xp: 66903508,
    },
    {
      id: 8,
      name: "Cooking",
      rank: 209152,
      level: 99,
      xp: 13186361,
    },
    {
      id: 9,
      name: "Woodcutting",
      rank: 116623,
      level: 99,
      xp: 13305319,
    },
    {
      id: 10,
      name: "Fletching",
      rank: 209321,
      level: 99,
      xp: 13039336,
    },
    {
      id: 11,
      name: "Fishing",
      rank: 149288,
      level: 99,
      xp: 13034935,
    },
    {
      id: 12,
      name: "Firemaking",
      rank: 142140,
      level: 99,
      xp: 13234034,
    },
    {
      id: 13,
      name: "Crafting",
      rank: 167122,
      level: 99,
      xp: 13076618,
    },
    {
      id: 14,
      name: "Smithing",
      rank: 114904,
      level: 99,
      xp: 13036476,
    },
    {
      id: 15,
      name: "Mining",
      rank: 118982,
      level: 99,
      xp: 13083814,
    },
    {
      id: 16,
      name: "Herblore",
      rank: 49827,
      level: 99,
      xp: 13351260,
    },
    {
      id: 17,
      name: "Agility",
      rank: 58227,
      level: 99,
      xp: 13207958,
    },
    {
      id: 18,
      name: "Thieving",
      rank: 117816,
      level: 99,
      xp: 13230728,
    },
    {
      id: 19,
      name: "Slayer",
      rank: 21717,
      level: 99,
      xp: 25892505,
    },
    {
      id: 20,
      name: "Farming",
      rank: 142643,
      level: 99,
      xp: 14474948,
    },
    {
      id: 21,
      name: "Runecraft",
      rank: 76832,
      level: 99,
      xp: 13042366,
    },
    {
      id: 22,
      name: "Hunter",
      rank: 48753,
      level: 99,
      xp: 14057123,
    },
    {
      id: 23,
      name: "Construction",
      rank: 95336,
      level: 99,
      xp: 13063478,
    },
  ],
  activities: [
    {
      id: 0,
      name: "League Points",
      rank: -1,
      score: -1,
    },
    {
      id: 1,
      name: "Deadman Points",
      rank: -1,
      score: -1,
    },
    {
      id: 2,
      name: "Bounty Hunter - Hunter",
      rank: 25304,
      score: 32,
    },
    {
      id: 3,
      name: "Bounty Hunter - Rogue",
      rank: -1,
      score: -1,
    },
    {
      id: 4,
      name: "Bounty Hunter (Legacy) - Hunter",
      rank: -1,
      score: -1,
    },
    {
      id: 5,
      name: "Bounty Hunter (Legacy) - Rogue",
      rank: -1,
      score: -1,
    },
    {
      id: 6,
      name: "Clue Scrolls (all)",
      rank: 699812,
      score: 207,
    },
    {
      id: 7,
      name: "Clue Scrolls (beginner)",
      rank: 90579,
      score: 29,
    },
    {
      id: 8,
      name: "Clue Scrolls (easy)",
      rank: 84335,
      score: 16,
    },
    {
      id: 9,
      name: "Clue Scrolls (medium)",
      rank: 57820,
      score: 27,
    },
    {
      id: 10,
      name: "Clue Scrolls (hard)",
      rank: 45370,
      score: 35,
    },
    {
      id: 11,
      name: "Clue Scrolls (elite)",
      rank: 68120,
      score: 51,
    },
    {
      id: 12,
      name: "Clue Scrolls (master)",
      rank: 57511,
      score: 49,
    },
    {
      id: 13,
      name: "LMS - Rank",
      rank: -1,
      score: -1,
    },
    {
      id: 14,
      name: "PvP Arena - Rank",
      rank: -1,
      score: -1,
    },
    {
      id: 15,
      name: "Soul Wars Zeal",
      rank: 18559,
      score: 6371,
    },
    {
      id: 16,
      name: "Rifts closed",
      rank: 93770,
      score: 264,
    },
    {
      id: 17,
      name: "Colosseum Glory",
      rank: 3857,
      score: 47321,
    },
    {
      id: 18,
      name: "Collections Logged",
      rank: 51218,
      score: 527,
    },
    {
      id: 19,
      name: "Abyssal Sire",
      rank: 36214,
      score: 734,
    },
    {
      id: 20,
      name: "Alchemical Hydra",
      rank: 154020,
      score: 321,
    },
    {
      id: 21,
      name: "Amoxliatl",
      rank: 5799,
      score: 251,
    },
    {
      id: 22,
      name: "Araxxor",
      rank: 2589,
      score: 2407,
    },
    {
      id: 23,
      name: "Artio",
      rank: 1857,
      score: 2945,
    },
    {
      id: 24,
      name: "Barrows Chests",
      rank: 192967,
      score: 312,
    },
    {
      id: 25,
      name: "Bryophyta",
      rank: 226904,
      score: 6,
    },
    {
      id: 26,
      name: "Callisto",
      rank: 214067,
      score: 20,
    },
    {
      id: 27,
      name: "Calvar'ion",
      rank: 4667,
      score: 1344,
    },
    {
      id: 28,
      name: "Cerberus",
      rank: 546,
      score: 8765,
    },
    {
      id: 29,
      name: "Chambers of Xeric",
      rank: 223382,
      score: 30,
    },
    {
      id: 30,
      name: "Chambers of Xeric: Challenge Mode",
      rank: 4037,
      score: 512,
    },
    {
      id: 31,
      name: "Chaos Elemental",
      rank: 5122,
      score: 544,
    },
    {
      id: 32,
      name: "Chaos Fanatic",
      rank: 7496,
      score: 508,
    },
    {
      id: 33,
      name: "Commander Zilyana",
      rank: 72302,
      score: 268,
    },
    {
      id: 34,
      name: "Corporeal Beast",
      rank: 4786,
      score: 1450,
    },
    {
      id: 35,
      name: "Crazy Archaeologist",
      rank: 11967,
      score: 348,
    },
    {
      id: 36,
      name: "Dagannoth Prime",
      rank: 338690,
      score: 28,
    },
    {
      id: 37,
      name: "Dagannoth Rex",
      rank: 172759,
      score: 259,
    },
    {
      id: 38,
      name: "Dagannoth Supreme",
      rank: 286680,
      score: 51,
    },
    {
      id: 39,
      name: "Deranged Archaeologist",
      rank: 125894,
      score: 25,
    },
    {
      id: 40,
      name: "Duke Sucellus",
      rank: 5932,
      score: 1537,
    },
    {
      id: 41,
      name: "General Graardor",
      rank: 6435,
      score: 2417,
    },
    {
      id: 42,
      name: "Giant Mole",
      rank: 68648,
      score: 601,
    },
    {
      id: 43,
      name: "Grotesque Guardians",
      rank: 1777,
      score: 2704,
    },
    {
      id: 44,
      name: "Hespori",
      rank: 636989,
      score: 8,
    },
    {
      id: 45,
      name: "Kalphite Queen",
      rank: 3465,
      score: 1736,
    },
    {
      id: 46,
      name: "King Black Dragon",
      rank: 2580,
      score: 4157,
    },
    {
      id: 47,
      name: "Kraken",
      rank: 59431,
      score: 3133,
    },
    {
      id: 48,
      name: "Kree'Arra",
      rank: 110664,
      score: 100,
    },
    {
      id: 49,
      name: "K'ril Tsutsaroth",
      rank: 8437,
      score: 869,
    },
    {
      id: 50,
      name: "Lunar Chests",
      rank: 191999,
      score: 25,
    },
    {
      id: 51,
      name: "Mimic",
      rank: 88548,
      score: 3,
    },
    {
      id: 52,
      name: "Nex",
      rank: 75238,
      score: 218,
    },
    {
      id: 53,
      name: "Nightmare",
      rank: 63131,
      score: 33,
    },
    {
      id: 54,
      name: "Phosani's Nightmare",
      rank: 34851,
      score: 25,
    },
    {
      id: 55,
      name: "Obor",
      rank: 336362,
      score: 5,
    },
    {
      id: 56,
      name: "Phantom Muspah",
      rank: 2112,
      score: 1438,
    },
    {
      id: 57,
      name: "Sarachnis",
      rank: 2044,
      score: 3697,
    },
    {
      id: 58,
      name: "Scorpia",
      rank: 15423,
      score: 372,
    },
    {
      id: 59,
      name: "Scurrius",
      rank: 367,
      score: 6713,
    },
    {
      id: 60,
      name: "Skotizo",
      rank: 95608,
      score: 43,
    },
    {
      id: 61,
      name: "Sol Heredit",
      rank: 2209,
      score: 80,
    },
    {
      id: 62,
      name: "Spindel",
      rank: 52,
      score: 12180,
    },
    {
      id: 63,
      name: "Tempoross",
      rank: 170757,
      score: 127,
    },
    {
      id: 64,
      name: "The Gauntlet",
      rank: 173952,
      score: 19,
    },
    {
      id: 65,
      name: "The Corrupted Gauntlet",
      rank: 175358,
      score: 61,
    },
    {
      id: 66,
      name: "The Hueycoatl",
      rank: 97227,
      score: 25,
    },
    {
      id: 67,
      name: "The Leviathan",
      rank: 26245,
      score: 231,
    },
    {
      id: 68,
      name: "The Royal Titans",
      rank: 9092,
      score: 429,
    },
    {
      id: 69,
      name: "The Whisperer",
      rank: 16416,
      score: 392,
    },
    {
      id: 70,
      name: "Theatre of Blood",
      rank: 15806,
      score: 538,
    },
    {
      id: 71,
      name: "Theatre of Blood: Hard Mode",
      rank: 86,
      score: 1389,
    },
    {
      id: 72,
      name: "Thermonuclear Smoke Devil",
      rank: 4515,
      score: 4199,
    },
    {
      id: 73,
      name: "Tombs of Amascut",
      rank: 55984,
      score: 97,
    },
    {
      id: 74,
      name: "Tombs of Amascut: Expert Mode",
      rank: 10395,
      score: 444,
    },
    {
      id: 75,
      name: "TzKal-Zuk",
      rank: 9547,
      score: 7,
    },
    {
      id: 76,
      name: "TzTok-Jad",
      rank: 4541,
      score: 57,
    },
    {
      id: 77,
      name: "Vardorvis",
      rank: 33018,
      score: 682,
    },
    {
      id: 78,
      name: "Venenatis",
      rank: 8318,
      score: 1254,
    },
    {
      id: 79,
      name: "Vet'ion",
      rank: 85712,
      score: 67,
    },
    {
      id: 80,
      name: "Vorkath",
      rank: 49707,
      score: 1344,
    },
    {
      id: 81,
      name: "Wintertodt",
      rank: 465826,
      score: 245,
    },
    {
      id: 82,
      name: "Zalcano",
      rank: 97179,
      score: 128,
    },
    {
      id: 83,
      name: "Zulrah",
      rank: 4066,
      score: 8021,
    },
  ],
};
