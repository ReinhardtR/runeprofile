import { describe, expect, test } from "vitest";

import { COLLECTION_LOG_TABS, getLogCounters } from "./collection-log";

const counters = COLLECTION_LOG_TABS.flatMap((tab) => tab.pages).flatMap(
  (page) => (page.counters ?? []).map((counter) => ({ page, counter })),
);

describe("collection log counters", () => {
  test("every counter has a data source", () => {
    for (const { page, counter } of counters) {
      expect(
        (counter.keys?.length ?? 0) > 0 || counter.hiscore !== undefined,
        `${page.name}: ${counter.label}`,
      ).toBe(true);
    }
  });

  test("keys are in Chat Commands' stored form (lowercase, no colons)", () => {
    for (const { page, counter } of counters) {
      for (const key of counter.keys ?? []) {
        expect(key, page.name).toBe(key.toLowerCase().replace(/:/g, ""));
      }
    }
  });

  test("personal bests only come from the plugin", () => {
    for (const { page, counter } of counters) {
      if (counter.type === "pb") {
        expect(counter.hiscore, page.name).toBeUndefined();
        expect(counter.keys?.length, page.name).toBeGreaterThan(0);
      }
    }
  });

  test("every counter has a short label for the in-game !log reply", () => {
    for (const { page, counter } of counters) {
      expect(counter.shortLabel, `${page.name}: ${counter.label}`).toBeTruthy();
    }
  });

  test("short labels are unique within a page", () => {
    for (const page of COLLECTION_LOG_TABS.flatMap((tab) => tab.pages)) {
      const labels = (page.counters ?? []).map((c) => c.shortLabel);
      expect(new Set(labels).size, page.name).toBe(labels.length);
    }
  });

  test("!log orders only name kill counts the page has", () => {
    for (const page of COLLECTION_LOG_TABS.flatMap((tab) => tab.pages)) {
      if (!page.logCounters) continue;
      const resolved = getLogCounters(page);
      expect(
        resolved.map((c) => c.shortLabel),
        page.name,
      ).toEqual(page.logCounters);
      expect(
        resolved.every((c) => c.type === "kc"),
        page.name,
      ).toBe(true);
    }
  });

  test("!log puts normal mode first and leaves entry modes out", () => {
    const page = (name: string) =>
      COLLECTION_LOG_TABS.flatMap((tab) => tab.pages).find(
        (p) => p.name === name,
      )!;
    expect(
      getLogCounters(page("Theatre of Blood")).map((c) => c.label),
    ).toEqual([
      "Theatre of Blood completions",
      "Theatre of Blood (Hard) completions",
    ]);
    // The page itself keeps the game's order
    expect(page("Theatre of Blood").counters![0]!.label).toBe(
      "Theatre of Blood (Hard) completions",
    );
    expect(getLogCounters(page("Zulrah")).map((c) => c.shortLabel)).toEqual([
      "KC",
    ]);
  });
});
