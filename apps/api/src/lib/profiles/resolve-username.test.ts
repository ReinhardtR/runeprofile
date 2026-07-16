import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle as pgliteDrizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, test } from "vitest";

import { Database, accounts } from "@runeprofile/db";

import {
  cascadeFreedName,
  isUsernameUniqueViolation,
  resolveUsername,
} from "~/lib/profiles/resolve-username";

// In-memory Postgres with just the accounts table — the resolution logic
// only ever touches accounts.
const client = new PGlite();
const db = pgliteDrizzle(client, {
  casing: "snake_case",
}) as unknown as Database;

const bucket = {
  get: async () => null,
  put: async () => ({}),
  delete: async () => {},
} as unknown as R2Bucket;

const kv = {
  delete: async () => {},
} as unknown as KVNamespace;

const acc = (n: number) => String(n).padStart(28, "0");

async function getRow(id: string) {
  const rows = await db
    .select({
      username: accounts.username,
      pendingUsername: accounts.pendingUsername,
    })
    .from(accounts)
    .where(eq(accounts.id, id));
  return rows[0] ?? null;
}

async function seed(id: string, username: string) {
  await db.insert(accounts).values({ id, username, accountType: 0 });
}

// Mimics the POST /profiles flow: resolve, apply the resolution to the
// claimant's own row, then cascade any freed name.
async function sync(id: string, reported: string) {
  const row = await getRow(id);
  const resolution = await resolveUsername(db, bucket, kv, {
    id,
    reportedUsername: reported,
    currentUsername: row?.username ?? null,
  });

  if (row) {
    await db
      .update(accounts)
      .set({
        username: resolution.username,
        pendingUsername: resolution.pendingUsername,
      })
      .where(eq(accounts.id, id));
  } else {
    await db.insert(accounts).values({
      id,
      username: resolution.username,
      pendingUsername: resolution.pendingUsername,
      accountType: 0,
    });
  }

  if (resolution.freedName) {
    await cascadeFreedName(db, bucket, kv, resolution.freedName);
  }

  return resolution;
}

beforeEach(async () => {
  await client.exec(`
    DROP TABLE IF EXISTS accounts;
    CREATE TABLE accounts (
      id text PRIMARY KEY NOT NULL,
      username text NOT NULL,
      pending_username text,
      account_type integer NOT NULL DEFAULT 0,
      banned boolean NOT NULL DEFAULT false,
      clan_name text,
      clan_rank integer,
      clan_icon integer,
      clan_title text,
      group_name text,
      default_clog_page text,
      force_resync boolean NOT NULL DEFAULT false,
      updated_at timestamp NOT NULL DEFAULT now(),
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX accounts_username_unique_index ON accounts (lower(username));
    CREATE INDEX accounts_pending_username_index ON accounts (lower(pending_username));
  `);
});

describe("resolveUsername", () => {
  test("free name is granted", async () => {
    await seed(acc(1), "Foo");

    const resolution = await sync(acc(1), "Bar");

    expect(resolution).toEqual({
      username: "Bar",
      pendingUsername: null,
      freedName: "Foo",
    });
    expect(await getRow(acc(1))).toEqual({
      username: "Bar",
      pendingUsername: null,
    });
  });

  test("unchanged name is a no-op", async () => {
    await seed(acc(1), "Foo");

    const resolution = await sync(acc(1), "Foo");

    expect(resolution).toEqual({
      username: "Foo",
      pendingUsername: null,
      freedName: null,
    });
  });

  test("capitalization-only change is granted without conflict", async () => {
    await seed(acc(1), "foo bar");

    const resolution = await sync(acc(1), "Foo Bar");

    expect(resolution).toEqual({
      username: "Foo Bar",
      pendingUsername: null,
      freedName: null,
    });
    expect(await getRow(acc(1))).toEqual({
      username: "Foo Bar",
      pendingUsername: null,
    });
  });

  test("taken name is parked as pending (case-insensitive)", async () => {
    await seed(acc(1), "Foo");
    await seed(acc(2), "Bar");

    const resolution = await sync(acc(2), "FOO");

    expect(resolution).toEqual({
      username: "Bar",
      pendingUsername: "FOO",
      freedName: null,
    });
    expect(await getRow(acc(1))).toEqual({
      username: "Foo",
      pendingUsername: null,
    });
    expect(await getRow(acc(2))).toEqual({
      username: "Bar",
      pendingUsername: "FOO",
    });
  });

  test("a parked name is replaced by the latest reported name", async () => {
    await seed(acc(1), "Foo");
    await seed(acc(2), "Bar");

    await sync(acc(2), "Foo");
    // Player changed their mind (or changed back) — pending must follow.
    const resolution = await sync(acc(2), "Baz");

    expect(resolution).toEqual({
      username: "Baz",
      pendingUsername: null,
      freedName: "Bar",
    });
    expect(await getRow(acc(2))).toEqual({
      username: "Baz",
      pendingUsername: null,
    });
  });

  test("two-account name swap resolves on the second sync", async () => {
    await seed(acc(1), "Foo");
    await seed(acc(2), "Bar");

    // acc1 renamed Foo -> Bar in game, acc2 renamed Bar -> Foo.
    const first = await sync(acc(1), "Bar");
    expect(first.pendingUsername).toBe("Bar");

    const second = await sync(acc(2), "Foo");
    expect(second).toEqual({
      username: "Foo",
      pendingUsername: null,
      freedName: null,
    });

    expect(await getRow(acc(1))).toEqual({
      username: "Bar",
      pendingUsername: null,
    });
    expect(await getRow(acc(2))).toEqual({
      username: "Foo",
      pendingUsername: null,
    });
  });

  test("three-account rotation resolves on the last sync", async () => {
    await seed(acc(1), "A");
    await seed(acc(2), "B");
    await seed(acc(3), "C");

    // In game: acc1 A->B, acc2 B->C, acc3 C->A.
    await sync(acc(1), "B");
    await sync(acc(2), "C");
    const last = await sync(acc(3), "A");

    expect(last.username).toBe("A");
    expect(await getRow(acc(1))).toEqual({ username: "B", pendingUsername: null });
    expect(await getRow(acc(2))).toEqual({ username: "C", pendingUsername: null });
    expect(await getRow(acc(3))).toEqual({ username: "A", pendingUsername: null });
  });

  test("chain unwinds when its last wanted name frees up", async () => {
    await seed(acc(1), "N1");
    await seed(acc(2), "N2");
    await seed(acc(3), "N3");

    // In game: acc1 N1->N2, acc2 N2->N3, acc3 N3->N4 (a fresh name).
    await sync(acc(2), "N3"); // parked behind acc3
    await sync(acc(1), "N2"); // parked behind acc2
    const last = await sync(acc(3), "N4"); // frees N3, cascade settles all

    expect(last).toEqual({
      username: "N4",
      pendingUsername: null,
      freedName: "N3",
    });
    expect(await getRow(acc(1))).toEqual({ username: "N2", pendingUsername: null });
    expect(await getRow(acc(2))).toEqual({ username: "N3", pendingUsername: null });
    expect(await getRow(acc(3))).toEqual({ username: "N4", pendingUsername: null });
  });

  test("chain unwind triggered by the waiting account's own sync", async () => {
    await seed(acc(1), "N1");
    await seed(acc(2), "N2");

    // acc2 wants N3 which is free, but hasn't synced yet; acc1 wants N2.
    await db
      .update(accounts)
      .set({ pendingUsername: "N3" })
      .where(eq(accounts.id, acc(2)));

    // acc1 syncs: chain acc1 -> N2 (acc2) -> N3 (free) unwinds everything.
    const resolution = await sync(acc(1), "N2");

    expect(resolution).toEqual({
      username: "N2",
      pendingUsername: null,
      freedName: "N1",
    });
    expect(await getRow(acc(1))).toEqual({ username: "N2", pendingUsername: null });
    expect(await getRow(acc(2))).toEqual({ username: "N3", pendingUsername: null });
  });

  test("new account with a taken name gets a placeholder + pending", async () => {
    await seed(acc(1), "Foo");

    const resolution = await sync(acc(2), "Foo");

    // Placeholder must not expose the account id and must be longer than any
    // claimable reported name (12 chars max).
    expect(resolution.username).toMatch(/^archive_[0-9a-f]{8}$/);
    expect(resolution.username).not.toContain(acc(2));
    expect(resolution.pendingUsername).toBe("Foo");
    expect(resolution.freedName).toBeNull();

    // The name frees up later; the parked account is granted it.
    await sync(acc(1), "Other");
    expect(await getRow(acc(2))).toEqual({
      username: "Foo",
      pendingUsername: null,
    });
  });

  test("cycle not involving the claimant does not move other rows", async () => {
    await seed(acc(1), "A");
    await seed(acc(2), "B");
    await seed(acc(3), "C");

    // acc1 and acc2 are a swap pair waiting on each other... except neither
    // has completed it; acc3 wants A and must simply park.
    await db
      .update(accounts)
      .set({ pendingUsername: "B" })
      .where(eq(accounts.id, acc(1)));
    await db
      .update(accounts)
      .set({ pendingUsername: "A" })
      .where(eq(accounts.id, acc(2)));

    const resolution = await sync(acc(3), "A");

    expect(resolution.pendingUsername).toBe("A");
    expect(await getRow(acc(1))).toEqual({ username: "A", pendingUsername: "B" });
    expect(await getRow(acc(2))).toEqual({ username: "B", pendingUsername: "A" });
  });
});

describe("isUsernameUniqueViolation", () => {
  test("matches the accounts username unique index violation", () => {
    expect(
      isUsernameUniqueViolation({
        code: "23505",
        constraint_name: "accounts_username_unique_index",
      }),
    ).toBe(true);
  });

  test("ignores other errors", () => {
    expect(isUsernameUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUsernameUniqueViolation(null)).toBe(false);
    expect(
      isUsernameUniqueViolation({ code: "23505", constraint_name: "other" }),
    ).toBe(false);
  });
});
