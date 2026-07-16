import {
  COLLECTION_LOG_TABS,
  COMBAT_ACHIEVEMENT_VARPS,
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
    version: 2,
    pages,
    combatAchievementVarps: [...COMBAT_ACHIEVEMENT_VARPS],
    valuableDropThreshold: ValuableDropThreshold,
    specialValuableDrops: SPECIAL_VALUABLE_DROPS.map(({ itemId, value }) => ({
      itemId,
      value,
    })),
  };
}
