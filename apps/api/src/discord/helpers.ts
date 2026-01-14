import { AccountType, COLLECTION_LOG_ITEMS } from "@runeprofile/runescape";

import { getAccountTypeEmoji } from "~/discord/emojis";

export function getItemName(itemId: number): string {
  return COLLECTION_LOG_ITEMS[itemId] ?? `Unknown Item (${itemId})`;
}

const ITEM_ICON_BASE_URL = "https://chisel.weirdgloop.org/static/img/osrs-dii";
export function getItemIconUrl(itemId: number): string {
  return `${ITEM_ICON_BASE_URL}/${itemId}.png`;
}

export function buildPlayerTitle(
  rsn: string,
  accountType?: AccountType,
): string {
  const emoji = getAccountTypeEmoji(accountType);
  return emoji ? `${emoji} ${rsn}` : rsn;
}
