"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { eq, like, sql } from "drizzle-orm";

import { accounts } from "@runeprofile/db";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Accounts matching a username substring, an id, or an id prefix.
 *
 * The same matching the Accounts page uses, but selecting only what this page
 * shows. Exact matches sort first, then prefixes, then substrings.
 */
export async function searchAccountsForModels(q: string) {
  await requireAdmin();

  const raw = q.trim();
  if (!raw) return [];

  const fields = {
    id: accounts.id,
    username: accounts.username,
    updatedAt: accounts.updatedAt,
  };

  if (UUID_REGEX.test(raw)) {
    return db
      .select(fields)
      .from(accounts)
      .where(eq(accounts.id, raw))
      .limit(1);
  }

  if (/^[0-9a-f-]{4,}$/i.test(raw) && raw.length < 36) {
    return db
      .select(fields)
      .from(accounts)
      .where(like(accounts.id, `${raw}%`))
      .limit(25);
  }

  const term = raw.toLowerCase();
  return db
    .select(fields)
    .from(accounts)
    .where(sql`lower(${accounts.username}) like ${`%${term}%`}`)
    .orderBy(
      sql`CASE
        WHEN lower(${accounts.username}) = ${term} THEN 0
        WHEN lower(${accounts.username}) LIKE ${`${term}%`} THEN 1
        ELSE 2
      END`,
      accounts.username,
    )
    .limit(25);
}
