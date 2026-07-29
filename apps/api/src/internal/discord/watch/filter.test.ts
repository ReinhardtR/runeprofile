import { describe, expect, test } from "vitest";

import {
  ActivityEvent,
  ActivityEventType,
  CA_TASK_DEFAULT_TIER_THRESHOLD,
  type ChannelActivityFilters,
  DEFAULT_CHANNEL_SETTINGS,
  type DiscordChannelSettings,
  parseDiscordChannelSettings,
  parseThresholdInput,
} from "@runeprofile/runescape";

import {
  applyListFilter,
  applyThreshold,
  filterActivities,
  removeFilter,
} from "~/internal/discord/watch/filter";

const levelUp = (level: number): ActivityEvent => ({
  type: ActivityEventType.LEVEL_UP,
  data: { name: "Attack", level },
});

const valuableDrop = (value: number): ActivityEvent => ({
  type: ActivityEventType.VALUABLE_DROP,
  data: { itemId: 1, value },
});

const maxed = (): ActivityEvent => ({
  type: ActivityEventType.MAXED,
  data: {},
});

const questCompleted = (questId: number): ActivityEvent => ({
  type: ActivityEventType.QUEST_COMPLETED,
  data: { questId },
});

const caTask = (taskIndex: number): ActivityEvent => ({
  type: ActivityEventType.COMBAT_ACHIEVEMENT_TASK_COMPLETED,
  data: { taskIndex },
});

const COOKS_ASSISTANT_ID = 17; // Novice
const DRAGON_SLAYER_II_ID = 32; // Grandmaster

const NOXIOUS_FOE_INDEX = 0; // Easy
const COLLATERAL_DAMAGE_INDEX = 11; // Master
const FEATHER_HUNTER_INDEX = 15; // Grandmaster

const filters = (
  overrides: Partial<ChannelActivityFilters> = {},
): ChannelActivityFilters => ({
  mode: "blocklist",
  types: [],
  thresholds: {},
  ...overrides,
});

const settings = (
  overrides: Partial<ChannelActivityFilters> = {},
): DiscordChannelSettings => ({
  version: 2,
  filters: filters(overrides),
});

describe("filterActivities", () => {
  test("empty blocklist → everything passes", () => {
    const activities = [levelUp(40), valuableDrop(500_000), maxed()];
    expect(filterActivities(activities, filters())).toEqual(activities);
  });

  test("allowlist → only listed types pass", () => {
    const activities = [levelUp(40), valuableDrop(500_000), maxed()];
    const result = filterActivities(
      activities,
      filters({ mode: "allowlist", types: [ActivityEventType.MAXED] }),
    );
    expect(result).toEqual([maxed()]);
  });

  test("blocklist → everything except listed types passes", () => {
    const activities = [levelUp(40), maxed()];
    const result = filterActivities(
      activities,
      filters({ types: [ActivityEventType.MAXED] }),
    );
    expect(result).toEqual([levelUp(40)]);
  });

  test("threshold → only at-or-above the minimum passes", () => {
    const activities = [levelUp(40), levelUp(50), levelUp(70)];
    const result = filterActivities(
      activities,
      filters({ thresholds: { [ActivityEventType.LEVEL_UP]: 50 } }),
    );
    expect(result).toEqual([levelUp(50), levelUp(70)]);
  });

  test("threshold only affects its own type", () => {
    const activities = [levelUp(40), valuableDrop(2_000_000)];
    const result = filterActivities(
      activities,
      filters({ thresholds: { [ActivityEventType.LEVEL_UP]: 50 } }),
    );
    expect(result).toEqual([valuableDrop(2_000_000)]);
  });

  test("allowlist + threshold combine", () => {
    const activities = [levelUp(40), levelUp(60), maxed()];
    const result = filterActivities(
      activities,
      filters({
        mode: "allowlist",
        types: [ActivityEventType.LEVEL_UP],
        thresholds: { [ActivityEventType.LEVEL_UP]: 50 },
      }),
    );
    expect(result).toEqual([levelUp(60)]);
  });

  test("quest threshold filters by difficulty", () => {
    const activities = [
      questCompleted(COOKS_ASSISTANT_ID),
      questCompleted(DRAGON_SLAYER_II_ID),
    ];
    const result = filterActivities(
      activities,
      filters({
        thresholds: { [ActivityEventType.QUEST_COMPLETED]: 2 }, // Experienced+
      }),
    );
    expect(result).toEqual([questCompleted(DRAGON_SLAYER_II_ID)]);
  });

  test("default settings pass big level-ups and hard quests, drop the rest", () => {
    const activities = [
      levelUp(40),
      levelUp(50),
      valuableDrop(1_500_000),
      questCompleted(COOKS_ASSISTANT_ID),
      questCompleted(DRAGON_SLAYER_II_ID),
    ];
    const result = filterActivities(
      activities,
      DEFAULT_CHANNEL_SETTINGS.filters,
    );
    expect(result).toEqual([
      levelUp(50),
      valuableDrop(1_500_000),
      questCompleted(DRAGON_SLAYER_II_ID),
    ]);
  });

  test("combat achievement task threshold filters by the task's tier", () => {
    const activities = [
      caTask(NOXIOUS_FOE_INDEX),
      caTask(COLLATERAL_DAMAGE_INDEX),
      caTask(FEATHER_HUNTER_INDEX),
    ];
    const result = filterActivities(
      activities,
      filters({
        thresholds: {
          [ActivityEventType.COMBAT_ACHIEVEMENT_TASK_COMPLETED]: 6, // Grandmaster
        },
      }),
    );
    expect(result).toEqual([caTask(FEATHER_HUNTER_INDEX)]);
  });

  test("default settings only pass Master+ combat achievement tasks", () => {
    const activities = [
      caTask(NOXIOUS_FOE_INDEX),
      caTask(COLLATERAL_DAMAGE_INDEX),
      caTask(FEATHER_HUNTER_INDEX),
    ];
    const result = filterActivities(
      activities,
      DEFAULT_CHANNEL_SETTINGS.filters,
    );
    expect(result).toEqual([
      caTask(COLLATERAL_DAMAGE_INDEX),
      caTask(FEATHER_HUNTER_INDEX),
    ]);
  });
});

describe("applyListFilter", () => {
  test("adds to the list without duplicates", () => {
    const first = applyListFilter(
      settings(),
      ActivityEventType.MAXED,
      "blocklist",
    );
    const second = applyListFilter(
      first.settings,
      ActivityEventType.MAXED,
      "blocklist",
    );
    expect(second.settings.filters.types).toEqual([ActivityEventType.MAXED]);
    expect(second.notice).toBeUndefined();
  });

  test("switching mode clears the previous list and notices", () => {
    const blocked = settings({
      types: [ActivityEventType.MAXED, ActivityEventType.LEVEL_UP],
    });
    const { settings: next, notice } = applyListFilter(
      blocked,
      ActivityEventType.VALUABLE_DROP,
      "allowlist",
    );
    expect(next.filters.mode).toBe("allowlist");
    expect(next.filters.types).toEqual([ActivityEventType.VALUABLE_DROP]);
    expect(notice).toContain("removed 2 block filters");
  });

  test("switching from an empty list produces no notice", () => {
    const { settings: next, notice } = applyListFilter(
      settings(),
      ActivityEventType.MAXED,
      "allowlist",
    );
    expect(next.filters.mode).toBe("allowlist");
    expect(notice).toBeUndefined();
  });

  test("preserves thresholds and does not mutate the input", () => {
    const input = settings({
      thresholds: { [ActivityEventType.LEVEL_UP]: 50 },
    });
    const { settings: next } = applyListFilter(
      input,
      ActivityEventType.LEVEL_UP,
      "allowlist",
    );
    expect(next.filters.thresholds).toEqual({
      [ActivityEventType.LEVEL_UP]: 50,
    });
    expect(input.filters.mode).toBe("blocklist");
    expect(input.filters.types).toEqual([]);
  });
});

describe("applyThreshold", () => {
  test("sets and overwrites a threshold", () => {
    const first = applyThreshold(settings(), ActivityEventType.LEVEL_UP, 50);
    const second = applyThreshold(
      first.settings,
      ActivityEventType.LEVEL_UP,
      70,
    );
    expect(second.settings.filters.thresholds).toEqual({
      [ActivityEventType.LEVEL_UP]: 70,
    });
  });
});

describe("parseThresholdInput", () => {
  test("plain integers", () => {
    expect(parseThresholdInput("50")).toBe(50);
    expect(parseThresholdInput("5000000")).toBe(5_000_000);
  });

  test("digit separators", () => {
    expect(parseThresholdInput("5,000,000")).toBe(5_000_000);
    expect(parseThresholdInput("5 000 000")).toBe(5_000_000);
  });

  test("k/m/b shorthand, case-insensitive", () => {
    expect(parseThresholdInput("750k")).toBe(750_000);
    expect(parseThresholdInput("5m")).toBe(5_000_000);
    expect(parseThresholdInput("5M")).toBe(5_000_000);
    expect(parseThresholdInput("1.5b")).toBe(1_500_000_000);
    expect(parseThresholdInput(" 25m ")).toBe(25_000_000);
  });

  test("rejects invalid input", () => {
    expect(parseThresholdInput("")).toBeUndefined();
    expect(parseThresholdInput("abc")).toBeUndefined();
    expect(parseThresholdInput("5mm")).toBeUndefined();
    expect(parseThresholdInput("-5")).toBeUndefined();
    expect(parseThresholdInput("1.5")).toBeUndefined(); // fraction without suffix
    expect(parseThresholdInput("m")).toBeUndefined();
  });
});

describe("removeFilter", () => {
  const both = settings({
    mode: "allowlist",
    types: [ActivityEventType.LEVEL_UP, ActivityEventType.MAXED],
    thresholds: { [ActivityEventType.LEVEL_UP]: 50 },
  });

  test("kind=all removes list entry and threshold", () => {
    const { settings: next, removed } = removeFilter(
      both,
      ActivityEventType.LEVEL_UP,
      "all",
    );
    expect(removed).toBe(true);
    expect(next.filters.types).toEqual([ActivityEventType.MAXED]);
    expect(next.filters.thresholds).toEqual({});
  });

  test("kind=threshold keeps the list entry", () => {
    const { settings: next, removed } = removeFilter(
      both,
      ActivityEventType.LEVEL_UP,
      "threshold",
    );
    expect(removed).toBe(true);
    expect(next.filters.types).toContain(ActivityEventType.LEVEL_UP);
    expect(next.filters.thresholds).toEqual({});
  });

  test("kind=list keeps the threshold", () => {
    const { settings: next, removed } = removeFilter(
      both,
      ActivityEventType.LEVEL_UP,
      "list",
    );
    expect(removed).toBe(true);
    expect(next.filters.types).toEqual([ActivityEventType.MAXED]);
    expect(next.filters.thresholds).toEqual({
      [ActivityEventType.LEVEL_UP]: 50,
    });
  });

  test("removing the last allowed type reverts to blocklist with notice", () => {
    const single = settings({
      mode: "allowlist",
      types: [ActivityEventType.MAXED],
    });
    const { settings: next, notice } = removeFilter(
      single,
      ActivityEventType.MAXED,
      "all",
    );
    expect(next.filters.mode).toBe("blocklist");
    expect(next.filters.types).toEqual([]);
    expect(notice).toContain("receives every type");
  });

  test("nothing to remove → removed=false", () => {
    const { removed } = removeFilter(
      settings(),
      ActivityEventType.MAXED,
      "all",
    );
    expect(removed).toBe(false);
  });
});

describe("parseDiscordChannelSettings", () => {
  test("v2 document parses unchanged", () => {
    const doc = settings({
      thresholds: { [ActivityEventType.LEVEL_UP]: 70 },
    });
    expect(parseDiscordChannelSettings(doc)).toEqual(doc);
  });

  test("v2 document without a CA task threshold stays without one", () => {
    // A user who explicitly removed the threshold must not have it re-added.
    const doc = settings();
    const parsed = parseDiscordChannelSettings(doc);
    expect(
      parsed?.filters.thresholds[
        ActivityEventType.COMBAT_ACHIEVEMENT_TASK_COMPLETED
      ],
    ).toBeUndefined();
  });

  test("v1 document is migrated with the default CA task threshold", () => {
    const doc = {
      version: 1,
      filters: {
        mode: "blocklist",
        types: [ActivityEventType.MAXED],
        thresholds: { [ActivityEventType.LEVEL_UP]: 70 },
      },
    };
    expect(parseDiscordChannelSettings(doc)).toEqual({
      version: 2,
      filters: {
        mode: "blocklist",
        types: [ActivityEventType.MAXED],
        thresholds: {
          [ActivityEventType.LEVEL_UP]: 70,
          [ActivityEventType.COMBAT_ACHIEVEMENT_TASK_COMPLETED]:
            CA_TASK_DEFAULT_TIER_THRESHOLD,
        },
      },
    });
  });

  test("unrecognizable document returns undefined", () => {
    expect(parseDiscordChannelSettings({ version: 99 })).toBeUndefined();
    expect(parseDiscordChannelSettings(null)).toBeUndefined();
    expect(parseDiscordChannelSettings("garbage")).toBeUndefined();
  });

  test("migrated v1 settings drop low-tier CA tasks", () => {
    const parsed = parseDiscordChannelSettings({
      version: 1,
      filters: { mode: "blocklist", types: [], thresholds: {} },
    });
    expect(parsed).toBeDefined();
    const result = filterActivities(
      [caTask(NOXIOUS_FOE_INDEX), caTask(COLLATERAL_DAMAGE_INDEX)],
      parsed!.filters,
    );
    expect(result).toEqual([caTask(COLLATERAL_DAMAGE_INDEX)]);
  });
});
