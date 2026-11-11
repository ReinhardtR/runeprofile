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

function stubHiscores(response: () => Promise<Response>) {
  const fetchMock = vi.fn((_input: RequestInfo | URL) => response());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getCollectionLogPage counters", () => {
  test("serves plugin values without asking the hiscores", async () => {
    const fetchMock = stubHiscores(async () => new Response("{}"));
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

  test("falls back to the hiscores for kill counts the plugin lacks", async () => {
    const fetchMock = stubHiscores(
      async () =>
        new Response(
          JSON.stringify({
            skills: [],
            activities: [
              { id: 1, name: "Chambers of Xeric", rank: 5, score: 77 },
            ],
          }),
        ),
    );

    const page = await getCollectionLogPage(db, "Some Player", "cox");

    expect(page.counters).toEqual([
      {
        label: "Chambers of Xeric (CM) completions",
        shortLabel: "CM KC",
        type: "kc",
        value: null,
      },
      {
        label: "Chambers of Xeric completions",
        shortLabel: "KC",
        type: "kc",
        value: 77,
      },
      {
        label: "Personal Best (Challenge Mode)",
        shortLabel: "CM PB",
        type: "pb",
        value: null,
      },
      { label: "Personal Best", shortLabel: "PB", type: "pb", value: null },
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
    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      "player=Some%20Player",
    );
  });

  test("still serves the page when the hiscores are down", async () => {
    stubHiscores(async () => {
      throw new Error("network down");
    });

    const page = await getCollectionLogPage(db, "Some Player", "zulrah");

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.counters.map((c) => c.value)).toEqual([null, null]);
  });

  test("pages without counters skip the lookup entirely", async () => {
    const fetchMock = stubHiscores(async () => new Response("{}"));
    const page = await getCollectionLogPage(db, "Some Player", "Random Events");
    expect(page.counters).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("still serves the page when the records can't be read", async () => {
    stubHiscores(async () => {
      throw new Error("network down");
    });
    await client.exec("DROP TABLE boss_records");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const page = await getCollectionLogPage(db, "Some Player", "zulrah");

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.counters).toEqual([]);
  });
});
