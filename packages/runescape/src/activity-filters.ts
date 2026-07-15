import { getAchievementDiaryTierName } from "./achievement-diaries";
import {
  type ActivityEvent,
  ActivityEventType,
  type ActivityEventTypeValue,
  ValuableDropThreshold,
} from "./activities";
import { getCombatAchievementTierName } from "./combat-achievements";
import { getQuestById } from "./quests";

/**
 * Configuration describing the numeric "threshold" an activity type supports.
 *
 * A threshold is always a *minimum* — an activity passes the filter when its
 * extracted value is `>=` the configured threshold.
 */
export type ActivityThresholdConfig = {
  /** Short unit label, e.g. "level", "XP", "gp", "quest points", "tier". */
  unit: string;
  /** Inclusive lower bound for a valid threshold value. */
  min: number;
  /** Inclusive upper bound for a valid threshold value. */
  max: number;
  /** Suggested threshold values surfaced in Discord autocomplete. */
  suggestions: readonly number[];
  /** Extracts the comparable numeric value from a matching activity event. */
  getValue: (activity: ActivityEvent) => number;
  /**
   * Renders a threshold value as a complete, human-readable phrase used in
   * feedback text, autocomplete labels and the guide — e.g. `50` -> "level 50",
   * `50_000_000` -> "50M gp", tier `2` -> "Hard".
   */
  format: (value: number) => string;
};

export type ActivityFilterMeta = {
  /** Human-readable label for the activity type. */
  label: string;
  /** Threshold configuration, or `undefined` if the type isn't threshold-able. */
  threshold?: ActivityThresholdConfig;
  /**
   * Legacy types are no longer generated — they exist only to render old
   * activity log rows, and are hidden from the filter commands and guide.
   */
  legacy?: boolean;
};

/** Formats a large number into an abbreviated string, e.g. `50_000_000` -> "50M". */
function abbreviate(value: number): string {
  if (value >= 1_000_000_000)
    return `${Number((value / 1_000_000_000).toFixed(1))}B`;
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(1))}K`;
  return String(value);
}

/**
 * Single source of truth for activity-type labels and threshold behaviour.
 *
 * To make a new activity type threshold-able, add a `threshold` config here —
 * the Discord command options, autocomplete, feedback text, the filtering
 * engine, and the web guide all derive from this registry.
 */
export const ACTIVITY_FILTER_META: Record<
  ActivityEventTypeValue,
  ActivityFilterMeta
> = {
  [ActivityEventType.LEVEL_UP]: {
    label: "Level Up",
    threshold: {
      unit: "level",
      min: 1,
      max: 99,
      suggestions: [50, 60, 70, 80, 90, 95, 99],
      getValue: (a) =>
        a.type === ActivityEventType.LEVEL_UP ? a.data.level : 0,
      format: (v) => `level ${v}`,
    },
  },
  [ActivityEventType.XP_MILESTONE]: {
    label: "XP Milestone",
    threshold: {
      unit: "XP",
      min: 1,
      max: 200_000_000,
      suggestions: [
        25_000_000, 50_000_000, 100_000_000, 150_000_000, 200_000_000,
      ],
      getValue: (a) =>
        a.type === ActivityEventType.XP_MILESTONE ? a.data.xp : 0,
      format: (v) => `${abbreviate(v)} XP`,
    },
  },
  [ActivityEventType.VALUABLE_DROP]: {
    label: "Valuable Drop",
    threshold: {
      unit: "gp",
      // RuneProfile only records drops at or above this floor, so a lower
      // threshold would be a no-op.
      min: ValuableDropThreshold,
      max: 2_147_483_647,
      suggestions: [5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000],
      getValue: (a) =>
        a.type === ActivityEventType.VALUABLE_DROP ? a.data.value : 0,
      format: (v) => `${abbreviate(v)} gp`,
    },
  },
  [ActivityEventType.QUEST_COMPLETED]: {
    label: "Quest Completed",
    threshold: {
      unit: "quest points",
      min: 1,
      // Combo quests (e.g. Recipe for Disaster) award more than a single
      // quest's usual 1-6 points.
      max: 10,
      suggestions: [1, 2, 3, 5, 10],
      getValue: (a) =>
        a.type === ActivityEventType.QUEST_COMPLETED
          ? (getQuestById(a.data.questId)?.points ?? 0)
          : 0,
      format: (v) => `${v} quest points`,
    },
  },
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_REACHED]: {
    label: "Combat Achievement Tier Reached",
    threshold: {
      unit: "tier",
      min: 1,
      max: 6,
      suggestions: [1, 2, 3, 4, 5, 6],
      getValue: (a) =>
        a.type === ActivityEventType.COMBAT_ACHIEVEMENT_TIER_REACHED
          ? a.data.tierId
          : 0,
      format: (v) => getCombatAchievementTierName(v) ?? `tier ${v}`,
    },
  },
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED]: {
    label: "Combat Achievement",
    legacy: true,
  },
  [ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED]: {
    label: "Achievement Diary",
    threshold: {
      unit: "tier",
      min: 0,
      max: 3,
      suggestions: [0, 1, 2, 3],
      getValue: (a) =>
        a.type === ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED
          ? a.data.tier
          : 0,
      format: (v) => getAchievementDiaryTierName(v) ?? `tier ${v}`,
    },
  },
  [ActivityEventType.NEW_ITEM_OBTAINED]: {
    label: "New Item Obtained",
  },
  [ActivityEventType.MAXED]: {
    label: "Maxed",
  },
};

/** Returns the human-readable label for an activity type. */
export function getActivityTypeLabel(type: ActivityEventTypeValue): string {
  return ACTIVITY_FILTER_META[type]?.label ?? type;
}

/** Returns the threshold config for an activity type, or `undefined`. */
export function getActivityThresholdConfig(
  type: ActivityEventTypeValue,
): ActivityThresholdConfig | undefined {
  return ACTIVITY_FILTER_META[type]?.threshold;
}

/** Activity types users can filter on (excludes legacy types), in registry order. */
export const FILTERABLE_ACTIVITY_TYPES = (
  Object.keys(ACTIVITY_FILTER_META) as ActivityEventTypeValue[]
).filter((type) => !ACTIVITY_FILTER_META[type].legacy);

/** Activity types that support a threshold, in registry order. */
export const THRESHOLD_ACTIVITY_TYPES = FILTERABLE_ACTIVITY_TYPES.filter(
  (type) => ACTIVITY_FILTER_META[type].threshold !== undefined,
);

export type DefaultFilter = {
  activityType: ActivityEventTypeValue;
  mode?: "allow" | "block";
  threshold?: number;
};

/**
 * The default ("Light") filter set. Seeded into a channel the first time a
 * watch is added, and re-installed by `/watch filter reset`.
 */
export const DEFAULT_FILTERS: readonly DefaultFilter[] = [
  { activityType: ActivityEventType.LEVEL_UP, threshold: 50 },
  { activityType: ActivityEventType.QUEST_COMPLETED, threshold: 3 },
];
