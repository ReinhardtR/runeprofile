import { AccountType, COLLECTION_LOG_ITEMS } from "@runeprofile/runescape";

import { getAccountTypeEmoji } from "~/internal/discord/emojis";

export function getItemName(itemId: number): string {
  return COLLECTION_LOG_ITEMS[itemId] ?? `Unknown Item (${itemId})`;
}

const ITEM_ICON_BASE_URL = "https://static.runelite.net/cache/item/icon";
export function getItemIconUrl(itemId: number): string {
  return `${ITEM_ICON_BASE_URL}/${itemId}.png`;
}

// OSRS Wiki hosts skill icons at predictable URLs
export function getSkillIconUrl(skillName: string): string {
  const formatted =
    skillName.charAt(0).toUpperCase() + skillName.slice(1).toLowerCase();
  return `https://oldschool.runescape.wiki/images/${formatted}_icon.png`;
}

// TODO: Replace with self-hosted asset URL (e.g. R2 bucket)
const QUEST_ICON_URL =
  "https://oldschool.runescape.wiki/images/Quest_point_icon.png";
export function getQuestIconUrl(): string {
  return QUEST_ICON_URL;
}

// TODO: Replace with self-hosted asset URL (e.g. R2 bucket)
const ACHIEVEMENT_DIARY_ICON_URL =
  "https://oldschool.runescape.wiki/images/Achievement_Diaries_icon.png";
export function getAchievementDiaryIconUrl(): string {
  return ACHIEVEMENT_DIARY_ICON_URL;
}

// TODO: Replace with self-hosted asset URL (e.g. R2 bucket)
const COMBAT_ACHIEVEMENT_ICON_URL =
  "https://oldschool.runescape.wiki/images/Combat_Achievements_icon.png";
export function getCombatAchievementIconUrl(): string {
  return COMBAT_ACHIEVEMENT_ICON_URL;
}

// TODO: Replace with self-hosted asset URL (e.g. R2 bucket)
const MAX_CAPE_ICON_URL =
  "https://oldschool.runescape.wiki/images/Max_cape_detail.png";
export function getMaxCapeIconUrl(): string {
  return MAX_CAPE_ICON_URL;
}

export function buildPlayerTitle(params: {
  discordApplicationId: string;
  rsn: string;
  accountType?: AccountType;
}): string {
  const { discordApplicationId, rsn, accountType } = params;
  const emoji = getAccountTypeEmoji(discordApplicationId, accountType);
  return emoji ? `${emoji} ${rsn}` : rsn;
}

export function numberWithDelimiter(x: number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function numberWithAbbreviation(x: number): string {
  if (x < 1e3) return x.toString();
  if (x >= 1e3 && x < 1e6) return +(x / 1e3).toFixed(1) + "K";
  if (x >= 1e6 && x < 1e9) return +(x / 1e6).toFixed(1) + "M";
  if (x >= 1e9 && x < 1e12) return +(x / 1e9).toFixed(1) + "B";
  return x.toString();
}
