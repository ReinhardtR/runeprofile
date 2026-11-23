import { PGlite } from "@electric-sql/pglite";
import { drizzle as pgliteDrizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, test } from "vitest";

import { Database } from "@runeprofile/db";

import { FrontpageEvent } from "@runeprofile/runescape";

import { getEventLeaderboards } from "~/lib/metrics/get-event-leaderboards";

const client = new PGlite();
const db = pgliteDrizzle(client, {
  casing: "snake_case",
}) as unknown as Database;

const EVENT_ITEMS = [100, 101, 102];
const OTHER_ITEM = 999;

function event(
  clogItemIds: number[],
  purpleItemIds: number[] = clogItemIds,
): FrontpageEvent {
  return {
    name: "Test",
    clogItemIds,
    purpleItemIds,
    launchesAt: null,
    trailerUrl: null,
  };
}

// The old per-board signature, kept so the ranking tests read the same.
async function getEventLeaderboard(
  db: Database,
  itemIds: number[],
  rankBy: "obtained" | "quantity",
) {
  const boards = await getEventLeaderboards(db, event(itemIds));
  return rankBy === "obtained" ? boards.clog : boards.purples;
}

// In-memory Postgres with just the columns the leaderboard query touches.
async function seedAccount(
  username: string,
  owned: { id: number; quantity: number; createdAt?: string }[],
  opts: { banned?: boolean } = {},
) {
  const id = username.padStart(28, "0");
  await client.query(
    "INSERT INTO accounts (id, username, account_type, banned) VALUES ($1, $2, 1, $3)",
    [id, username, opts.banned ?? false],
  );
  for (const item of owned) {
    await client.query(
      "INSERT INTO items (account_id, id, quantity, created_at) VALUES ($1, $2, $3, $4)",
      [id, item.id, item.quantity, item.createdAt ?? new Date().toISOString()],
    );
  }
}

beforeEach(async () => {
  await client.exec(`
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS accounts;
    CREATE TABLE accounts (
      id text PRIMARY KEY NOT NULL,
      username text NOT NULL,
      account_type integer NOT NULL DEFAULT 0,
      banned boolean NOT NULL DEFAULT false
    );
    CREATE TABLE items (
      account_id text NOT NULL REFERENCES accounts(id),
      id integer NOT NULL,
      quantity integer NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      PRIMARY KEY (account_id, id)
    );
  `);
});

describe("getEventLeaderboards", () => {
  test("returns nothing without item ids, skipping the query", async () => {
    await seedAccount("alice", [{ id: 100, quantity: 1 }]);
    expect(await getEventLeaderboard(db, [], "obtained")).toEqual([]);
  });

  test("ranks by unique items obtained, ignoring non-event items", async () => {
    await seedAccount("alice", [
      { id: 100, quantity: 5 },
      { id: OTHER_ITEM, quantity: 50 },
    ]);
    await seedAccount("bob", [
      { id: 100, quantity: 1 },
      { id: 101, quantity: 1 },
    ]);

    const board = await getEventLeaderboard(db, EVENT_ITEMS, "obtained");

    expect(board.map((e) => [e.username, e.obtained])).toEqual([
      ["bob", 2],
      ["alice", 1],
    ]);
    expect(board[0]!.accountType.key).toBe("ironman");
  });

  test("ranks by summed quantity", async () => {
    await seedAccount("alice", [{ id: 100, quantity: 5 }]);
    await seedAccount("bob", [
      { id: 100, quantity: 1 },
      { id: 101, quantity: 1 },
    ]);

    const board = await getEventLeaderboard(db, EVENT_ITEMS, "quantity");

    expect(board.map((e) => [e.username, e.quantity])).toEqual([
      ["alice", 5],
      ["bob", 2],
    ]);
  });

  test("breaks ties by who logged their latest item first", async () => {
    await seedAccount("late", [
      { id: 100, quantity: 1, createdAt: "2026-11-02T00:00:00Z" },
    ]);
    await seedAccount("early", [
      { id: 100, quantity: 1, createdAt: "2026-11-01T00:00:00Z" },
    ]);

    const board = await getEventLeaderboard(db, EVENT_ITEMS, "obtained");

    expect(board.map((e) => e.username)).toEqual(["early", "late"]);
  });

  test("excludes banned accounts and zero quantities", async () => {
    await seedAccount("cheater", [{ id: 100, quantity: 9 }], { banned: true });
    await seedAccount("empty", [{ id: 100, quantity: 0 }]);

    expect(await getEventLeaderboard(db, EVENT_ITEMS, "quantity")).toEqual([]);
  });

  test("returns items in event order without exposing account ids", async () => {
    await seedAccount("alice", [
      { id: 102, quantity: 1 },
      { id: 100, quantity: 2 },
    ]);

    const [entry] = await getEventLeaderboard(db, EVENT_ITEMS, "obtained");

    expect(entry!.items).toEqual([
      { id: 100, quantity: 2 },
      { id: 102, quantity: 1 },
    ]);
    expect(Object.keys(entry!)).not.toContain("accountId");
    expect(JSON.stringify(entry)).not.toContain("0000alice");
  });

  test("ranks each board by its own items in a single query", async () => {
    // clog = Orion + purples; purples board only counts the purples.
    const boards = event([200, 100, 101], [100, 101]);
    await seedAccount("collector", [
      { id: 200, quantity: 1 },
      { id: 100, quantity: 1 },
      { id: 101, quantity: 1 },
    ]);
    await seedAccount("farmer", [{ id: 100, quantity: 7 }]);
    await seedAccount("petonly", [{ id: 200, quantity: 1 }]);

    const { clog, purples } = await getEventLeaderboards(db, boards);

    expect(clog.map((e) => [e.username, e.obtained])).toEqual([
      ["collector", 3],
      ["farmer", 1],
      ["petonly", 1],
    ]);
    expect(purples.map((e) => [e.username, e.quantity])).toEqual([
      ["farmer", 7],
      ["collector", 2],
    ]);
    // Each board only carries its own items.
    expect(clog[0]!.items.map((i) => i.id)).toEqual([200, 100, 101]);
    expect(purples[1]!.items.map((i) => i.id)).toEqual([100, 101]);
  });
});
