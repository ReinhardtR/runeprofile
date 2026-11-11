import { PGlite } from "@electric-sql/pglite";
import { drizzle as pgliteDrizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, test } from "vitest";

import * as schema from "@runeprofile/db";
import { Database } from "@runeprofile/db";
import { COLLECTION_LOG_TABS, CollectionLogPage } from "@runeprofile/runescape";

import {
  getBossRecords,
  resolvePageCounters,
  upsertBossRecords,
} from "~/lib/boss-records/boss-records";

const client = new PGlite();
const db = pgliteDrizzle(client, {
  schema,
  casing: "snake_case",
}) as unknown as Database;

const ID = "a".repeat(28);

beforeEach(async () => {
  await client.exec(`
    DROP TABLE IF EXISTS boss_records;
    DROP TABLE IF EXISTS accounts;
    CREATE TABLE accounts (id text PRIMARY KEY NOT NULL);
    CREATE TABLE boss_records (
      account_id text PRIMARY KEY NOT NULL REFERENCES accounts(id),
      kill_counts jsonb NOT NULL,
      personal_bests jsonb NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
    INSERT INTO accounts (id) VALUES ('${ID}');
  `);
});

async function updatedAt() {
  const res = await client.query<{ t: string }>(
    "SELECT updated_at::text AS t FROM boss_records",
  );
  return res.rows[0]?.t;
}

describe("upsertBossRecords", () => {
  test("creates the row, then merges new keys over old ones", async () => {
    await upsertBossRecords(db, ID, {
      killCounts: { zulrah: 10, vorkath: 3 },
      personalBests: { zulrah: 61.2 },
    });
    await upsertBossRecords(db, ID, {
      killCounts: { zulrah: 11, nex: 1 },
    });

    expect(await getBossRecords(db, ID)).toEqual({
      killCounts: { zulrah: 11, vorkath: 3, nex: 1 },
      personalBests: { zulrah: 61.2 },
    });
  });

  test("skips the write when nothing changed", async () => {
    await upsertBossRecords(db, ID, { killCounts: { zulrah: 10, nex: 2 } });
    await client.exec("UPDATE boss_records SET updated_at = '2000-01-01'");

    // a subset of what is stored is not a change
    await upsertBossRecords(db, ID, { killCounts: { zulrah: 10 } });
    expect(await updatedAt()).toBe("2000-01-01 00:00:00");

    await upsertBossRecords(db, ID, { killCounts: { zulrah: 12 } });
    expect(await updatedAt()).not.toBe("2000-01-01 00:00:00");
  });

  test("does nothing when there is nothing to store", async () => {
    await upsertBossRecords(db, ID, {});
    await upsertBossRecords(db, ID, { killCounts: {}, personalBests: {} });
    expect(await getBossRecords(db, ID)).toBeNull();
  });
});

const page = (name: string): CollectionLogPage =>
  COLLECTION_LOG_TABS.flatMap((t) => t.pages).find((p) => p.name === name)!;

describe("resolvePageCounters", () => {
  test("resolves every kill count and personal best on a multi-line page", () => {
    const records = {
      killCounts: { "corrupted gauntlet": 45, gauntlet: 312 },
      personalBests: { "corrupted gauntlet": 372.6, gauntlet: 580 },
    };

    expect(resolvePageCounters(page("The Gauntlet"), records)).toEqual([
      {
        label: "Corrupted Gauntlet completion count",
        shortLabel: "CG KC",
        type: "kc",
        value: 45,
      },
      {
        label: "Gauntlet completion count",
        shortLabel: "KC",
        type: "kc",
        value: 312,
      },
      {
        label: "Personal Best Corrupted",
        shortLabel: "CG PB",
        type: "pb",
        value: 372.6,
      },
      { label: "Personal Best", shortLabel: "PB", type: "pb", value: 580 },
    ]);
  });

  test("leaves lines without a plugin value unknown", () => {
    const records = { killCounts: { "dagannoth rex": 50 }, personalBests: {} };
    expect(
      resolvePageCounters(page("Dagannoth Kings"), records).map((c) => [
        c.label,
        c.value,
      ]),
    ).toEqual([
      ["Dagannoth Supreme kills", null],
      ["Dagannoth Prime kills", null],
      ["Dagannoth Rex kills", 50],
    ]);
    expect(resolvePageCounters(page("Zulrah"), null)).toEqual([
      { label: "Zulrah kills", shortLabel: "KC", type: "kc", value: null },
      { label: "Personal Best", shortLabel: "PB", type: "pb", value: null },
    ]);
  });

  test("uses the first candidate key the player has", () => {
    const records = {
      killCounts: { "the royal titans": 7 },
      personalBests: { "royal titan": 95 },
    };
    expect(
      resolvePageCounters(page("Royal Titans"), records).map((c) => c.value),
    ).toEqual([7, 95]);
  });
});
