const HISCORE_URL = (type?: string) =>
  `https://services.runescape.com/m=hiscore_oldschool${type ? `_${type}` : ""}/index_lite.json`;

export const HISCORE_LEADERBOARDS = {
  normal: { label: "Normal", url: HISCORE_URL() },
  ironman: { label: "Ironman", url: HISCORE_URL("ironman") },
  hardcore_ironman: {
    label: "Hardcore Ironman",
    url: HISCORE_URL("hardcore_ironman"),
  },
  ultimate: { label: "Ultimate Ironman", url: HISCORE_URL("ultimate") },
  skiller_defence: {
    label: "1 Defence Pure",
    url: HISCORE_URL("skiller_defence"),
  },
  skiller: { label: "Level 3 Skiller", url: HISCORE_URL("skiller") },
} as const;

export type HiscoreLeaderboardKey = keyof typeof HISCORE_LEADERBOARDS;

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
