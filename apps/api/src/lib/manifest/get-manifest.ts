import {
  COLLECTION_LOG_TABS,
  COMBAT_ACHIEVEMENT_VARPS,
  QUESTS,
  SPECIAL_VALUABLE_DROPS,
  ValuableDropThreshold,
} from "@runeprofile/runescape";

export type ManifestValuableDrop = {
  itemId: number;
  value: number;
};

export type Manifest = {
  version: number;
  pages: Record<string, string[]>;
  combatAchievementVarps: number[];
  /**
   * Quest ids to poll for state. These are the ids the game's own
   * QUEST_STATUS_GET clientscript takes, so the plugin needs nothing but the
   * list — the script does the varp read and threshold comparison itself.
   * Shipping them here decouples quest tracking from RuneLite's Quest enum,
   * which can lag a release by days; this registry is regenerated from the
   * game cache daily by the Update Game Data workflow.
   */
  questIds: number[];
  /** Minimum gp value for a drop to be recorded as valuable. */
  valuableDropThreshold: number;
  /** Items with a fixed value used instead of their GE price. */
  specialValuableDrops: ManifestValuableDrop[];
};

export function getManifest(): Manifest {
  const pages: Record<string, string[]> = {};

  for (const tab of COLLECTION_LOG_TABS) {
    for (const page of tab.pages) {
      pages[page.name] = page.aliases || [];
    }
  }

  return {
    // Bumped to 2 when special valuable drops + threshold were added.
    // Bumped to 3 when quest ids were added.
    version: 3,
    pages,
    combatAchievementVarps: [...COMBAT_ACHIEVEMENT_VARPS],
    questIds: QUESTS.map((quest) => quest.id),
    valuableDropThreshold: ValuableDropThreshold,
    specialValuableDrops: SPECIAL_VALUABLE_DROPS.map(({ itemId, value }) => ({
      itemId,
      value,
    })),
  };
}
