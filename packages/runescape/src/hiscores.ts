import { HARDCORE_MAIN_ACCOUNT_TYPE_ID } from "./account-types";

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
  hardcore_main: {
    label: "Hardcore Main",
    // Served from secure.runescape.com, unlike the others (matches RuneLite).
    url: "https://secure.runescape.com/m=hiscore_oldschool_hardcore_mains/index_lite.json",
  },
} as const;

export type HiscoreLeaderboardKey = keyof typeof HISCORE_LEADERBOARDS;

/**
 * The leaderboard a profile's own stats live on. Hardcore Mains are ranked on
 * their own hiscores; everything else is looked up on the normal ones.
 */
export function getHiscoreLeaderboardForAccountType(
  accountTypeId: number,
): HiscoreLeaderboardKey {
  return accountTypeId === HARDCORE_MAIN_ACCOUNT_TYPE_ID
    ? "hardcore_main"
    : "normal";
}

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
