export const AccountTypes = [
  { id: 0, key: "normal", name: "Normal" },
  { id: 1, key: "ironman", name: "Ironman" },
  { id: 2, key: "ultimate_ironman", name: "Ultimate Ironman" },
  { id: 3, key: "hardcore_ironman", name: "Hardcore Ironman" },
  { id: 4, key: "group_ironman", name: "Group Ironman" },
  { id: 5, key: "hardcore_group_ironman", name: "Hardcore Group Ironman" },
  { id: 6, key: "unranked_group_ironman", name: "Unranked Group Ironman" },
] as const satisfies { id: number; key: string; name: string }[];
export type AccountType = (typeof AccountTypes)[number];
