import { describe, expect, test } from "vitest";

import { ActivityEvent, ActivityEventType } from "@runeprofile/runescape";

import { filterActivities } from "~/internal/discord/watch/filter";

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

describe("filterActivities", () => {
  test("no filters → everything passes", () => {
    const activities = [levelUp(40), valuableDrop(500_000), maxed()];
    expect(filterActivities(activities, [])).toEqual(activities);
  });

  test("allow filter → only allowed types pass", () => {
    const activities = [levelUp(40), valuableDrop(500_000), maxed()];
    const result = filterActivities(activities, [
      { activityType: ActivityEventType.MAXED, mode: "allow", threshold: null },
    ]);
    expect(result).toEqual([maxed()]);
  });

  test("block filter → everything except blocked passes", () => {
    const activities = [levelUp(40), maxed()];
    const result = filterActivities(activities, [
      { activityType: ActivityEventType.MAXED, mode: "block", threshold: null },
    ]);
    expect(result).toEqual([levelUp(40)]);
  });

  test("threshold → only at-or-above the minimum passes", () => {
    const activities = [levelUp(40), levelUp(50), levelUp(70)];
    const result = filterActivities(activities, [
      { activityType: ActivityEventType.LEVEL_UP, mode: null, threshold: 50 },
    ]);
    expect(result).toEqual([levelUp(50), levelUp(70)]);
  });

  test("threshold only affects its own type", () => {
    const activities = [levelUp(40), valuableDrop(2_000_000)];
    const result = filterActivities(activities, [
      { activityType: ActivityEventType.LEVEL_UP, mode: null, threshold: 50 },
    ]);
    // level_up(40) dropped by threshold; valuable_drop untouched
    expect(result).toEqual([valuableDrop(2_000_000)]);
  });

  test("valuable drop threshold", () => {
    const activities = [valuableDrop(500_000), valuableDrop(5_000_000)];
    const result = filterActivities(activities, [
      {
        activityType: ActivityEventType.VALUABLE_DROP,
        mode: null,
        threshold: 1_000_000,
      },
    ]);
    expect(result).toEqual([valuableDrop(5_000_000)]);
  });

  test("allow + threshold combine", () => {
    const activities = [levelUp(40), levelUp(60), maxed()];
    const result = filterActivities(activities, [
      {
        activityType: ActivityEventType.LEVEL_UP,
        mode: "allow",
        threshold: 50,
      },
    ]);
    // only level_up allowed, and only >= 50
    expect(result).toEqual([levelUp(60)]);
  });
});
