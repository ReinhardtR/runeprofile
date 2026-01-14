import { AccountType } from "@runeprofile/runescape";

import { isProdDiscordBot } from "~/discord/constants";

type AccountTypeEmojiMap = Record<AccountType["id"], string>;

const DevAccountTypeEmojis: AccountTypeEmojiMap = {
  0: "",
  1: "<:ironman:1426652503243493519>",
  2: "<:ultimate_ironman:1426652465465528460>",
  3: "<:hardcore_ironman:1426652414693343344>",
  4: "<:group_ironman:1426652372054315161>",
  5: "<:hardcore_group_ironman:1426652397274529892>",
  6: "<:unranked_group_ironman:1426652448118013993>",
};

const ProdAccountTypeEmojis: AccountTypeEmojiMap = {
  0: "",
  1: "<:ironman:1460990252456870013>",
  2: "<:ultimate_ironman:1460990284157681664>",
  3: "<:hardcore_ironman:1460990273407422693>",
  4: "<:group_ironman:1460990295750742087>",
  5: "<:hardcore_group_ironman:1460990312527691786>",
  6: "<:unranked_group_ironman:1460990324607418453>",
};

function getAccountTypeEmojis(
  discordApplicationId: string,
): AccountTypeEmojiMap {
  return isProdDiscordBot(discordApplicationId)
    ? ProdAccountTypeEmojis
    : DevAccountTypeEmojis;
}

export function getAccountTypeEmoji(
  discordApplicationId: string,
  accountType?: AccountType,
): string {
  if (!accountType) return "";
  const emojis = getAccountTypeEmojis(discordApplicationId);
  return emojis[accountType.id] ?? "";
}
