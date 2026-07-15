import {
  AccountType,
  ActivityEvent,
  COLLECTION_LOG_ITEMS,
  COLLECTION_LOG_TABS,
} from "@runeprofile/runescape";

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
export function getCombatAchievementIconUrl(tierName: string): string {
  return `https://oldschool.runescape.wiki/images/Combat_Achievements_-_${tierName.toLowerCase()}_tier_icon.png`;
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

const SITE_BASE_URL = "https://runeprofile.com";

// itemId -> lowercased collection log page name. Used to deep-link an obtained
// item to the collection log page that contains it. The profile route only
// accepts a `page` value that matches a lowercased page name, so we lowercase here.
const ITEM_ID_TO_PAGE_NAME = new Map<number, string>();
for (const tab of COLLECTION_LOG_TABS) {
  for (const page of tab.pages) {
    const name = page.name.toLowerCase();
    for (const itemId of page.items) {
      if (!ITEM_ID_TO_PAGE_NAME.has(itemId)) {
        ITEM_ID_TO_PAGE_NAME.set(itemId, name);
      }
    }
  }
}

// Builds a deep link to the section of the player's profile most relevant to the
// activity, so the Discord embed title can link straight there (like the WoM bot).
export function buildActivityUrl(params: {
  rsn: string;
  activity: ActivityEvent;
}): string {
  const { rsn, activity } = params;
  const base = `${SITE_BASE_URL}/${encodeURIComponent(rsn)}`;

  switch (activity.type) {
    case "new_item_obtained":
    case "valuable_drop": {
      // Many valuable drops are not collection log items; fall back to the profile.
      const pageName = ITEM_ID_TO_PAGE_NAME.get(activity.data.itemId);
      return pageName ? `${base}?page=${encodeURIComponent(pageName)}` : base;
    }
    case "level_up":
    case "xp_milestone":
    case "maxed":
      return `${base}?tab=skills`;
    case "quest_completed":
      return `${base}?tab=quests`;
    case "achievement_diary_tier_completed":
      return `${base}?tab=diaries`;
    case "combat_achievement_tier_completed":
    case "combat_achievement_tier_reached":
      return `${base}?tab=cas&ca-tier=${activity.data.tierId}`;
  }
}
