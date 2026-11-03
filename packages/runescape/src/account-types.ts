export const AccountTypes = [
  { id: 0, key: "normal", name: "Normal" },
  { id: 1, key: "ironman", name: "Ironman" },
  { id: 2, key: "ultimate_ironman", name: "Ultimate Ironman" },
  { id: 3, key: "hardcore_ironman", name: "Hardcore Ironman" },
  { id: 4, key: "group_ironman", name: "Group Ironman" },
  { id: 5, key: "hardcore_group_ironman", name: "Hardcore Group Ironman" },
  { id: 6, key: "unranked_group_ironman", name: "Unranked Group Ironman" },
  // Not a value of the IRONMAN varbit: the API assigns it when the plugin
  // reports the HC_MAIN varbit (a Hardcore Worlds character) on a non-ironman.
  { id: 7, key: "hardcore_main", name: "Hardcore Main" },
] as const satisfies { id: number; key: string; name: string }[];
export type AccountType = (typeof AccountTypes)[number];

const GROUP_IRONMAN_ACCOUNT_TYPE_IDS = new Set([4, 5, 6]);

export function isGroupIronman(accountTypeId: number): boolean {
  return GROUP_IRONMAN_ACCOUNT_TYPE_IDS.has(accountTypeId);
}

export const HARDCORE_MAIN_ACCOUNT_TYPE_ID = 7;

/**
 * The stored account type for a plugin report: the IRONMAN varbit, except that
 * a non-ironman with the HC_MAIN varbit set is a Hardcore Main. The varbit
 * clears when the character transfers to the main game, so a transferred
 * character goes back to Normal on its next sync.
 */
export function resolveAccountType(
  ironmanVarbit: number,
  hardcoreMainVarbit: number | undefined,
): number {
  if (ironmanVarbit === 0 && hardcoreMainVarbit === 1) {
    return HARDCORE_MAIN_ACCOUNT_TYPE_ID;
  }
  return ironmanVarbit;
}
