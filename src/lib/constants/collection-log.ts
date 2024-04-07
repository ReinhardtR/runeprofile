export const TABS = ["bosses", "raids", "clues", "minigames", "other"] as const;
export type TabName = (typeof TABS)[number];
export const isValidTab = (tab: string): tab is TabName => {
  return TABS.includes(tab as TabName);
};
