import { AccountType } from "@runeprofile/runescape";

const AccountTypeEmojis: Record<AccountType["id"], string> = {
  0: "",
  1: "<:ironman:1426652503243493519>",
  2: "<:ultimate_ironman:1426652465465528460>",
  3: "<:hardcore_ironman:1426652414693343344>",
  4: "<:group_ironman:1426652372054315161>",
  5: "<:hardcore_group_ironman:1426652397274529892>",
  6: "<:unranked_group_ironman:1426652448118013993>",
};

export function getAccountTypeEmoji(accountType?: AccountType): string {
  if (!accountType) return "";
  return AccountTypeEmojis[accountType.id] ?? "";
}
