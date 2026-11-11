import { PGlite } from "@electric-sql/pglite";
import { drizzle as pgliteDrizzle } from "drizzle-orm/pglite";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import * as schema from "@runeprofile/db";
import { Database } from "@runeprofile/db";

import { upsertBossRecords } from "~/lib/boss-records/boss-records";
import { getCollectionLogPage } from "~/lib/collection-log/get-collection-log-page";

const client = new PGlite();
const db = pgliteDrizzle(client, {
  schema,
  casing: "snake_case",
}) as unknown as Database;

const ID = "b".repeat(28);

beforeEach(async () => {
  await client.exec(`
    DROP TABLE IF EXISTS boss_records;
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS accounts;
    CREATE TABLE accounts (
      id text PRIMARY KEY NOT NULL,
      username text NOT NULL,
      account_type integer NOT NULL DEFAULT 0
    );
    CREATE TABLE items (
      account_id text NOT NULL REFERENCES accounts(id),
      id integer NOT NULL,
      quantity integer NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      PRIMARY KEY (account_id, id)
    );
    CREATE TABLE boss_records (
      account_id text PRIMARY KEY NOT NULL REFERENCES accounts(id),
      kill_counts jsonb NOT NULL,
      personal_bests jsonb NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
    INSERT INTO accounts (id, username) VALUES ('${ID}', 'Some Player');
  `);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// The page must never reach out to the hiscores (or anything else).
function stubFetch() {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL) => {
    throw new Error("unexpected fetch");
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getCollectionLogPage counters", () => {
  test("serves plugin values without asking the hiscores", async () => {
    const fetchMock = stubFetch();
    await upsertBossRecords(db, ID, {
      killCounts: { zulrah: 1234 },
      personalBests: { zulrah: 54 },
    });

    const page = await getCollectionLogPage(db, "some player", "zulrah");

    expect(page.counters).toEqual([
      { label: "Zulrah kills", shortLabel: "KC", type: "kc", value: 1234 },
      { label: "Personal Best", shortLabel: "PB", type: "pb", value: 54 },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(page).not.toHaveProperty("id");
  });

  test("leaves kill counts the plugin lacks unknown, even with a hiscore", async () => {
    const fetchMock = stubFetch();
    await upsertBossRecords(db, ID, {
      killCounts: { "chambers of xeric": 77 },
      personalBests: {},
    });

    const page = await getCollectionLogPage(db, "Some Player", "cox");

    expect(page.counters.map((c) => [c.shortLabel, c.value])).toEqual([
      ["CM KC", null],
      ["KC", 77],
      ["CM PB", null],
      ["PB", null],
    ]);
    // !log: normal mode first, no personal bests
    expect(page.logCounters).toEqual([
      {
        label: "Chambers of Xeric completions",
        shortLabel: "KC",
        type: "kc",
        value: 77,
      },
      {
        label: "Chambers of Xeric (CM) completions",
        shortLabel: "CM KC",
        type: "kc",
        value: null,
      },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("pages without counters skip the lookup entirely", async () => {
    stubFetch();
    const page = await getCollectionLogPage(db, "Some Player", "Random Events");
    expect(page.counters).toEqual([]);
  });

  test("still serves the page when the records can't be read", async () => {
    stubFetch();
    await client.exec("DROP TABLE boss_records");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const page = await getCollectionLogPage(db, "Some Player", "zulrah");

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.counters).toEqual([]);
  });
});
