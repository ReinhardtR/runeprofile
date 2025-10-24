"use server";

import { getDb } from "@/lib/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { accounts, activities, autochunk } from "@runeprofile/db";
import { ActivityEvent } from "@runeprofile/runescape";

export async function findAccountsWithDuplicateActivities(
  targetTypes: ActivityEvent["type"][],
  limit = 100,
) {
  console.log("*** Finding accounts with duplicate activities ***");
  const db = getDb();
  // Find accountIds that have duplicate (type,data) combos for target types
  const rows = await db
    .select({
      accountId: activities.accountId,
      dupCount: sql<number>`count(*)`,
    })
    .from(activities)
    .where(inArray(activities.type, targetTypes))
    .groupBy(activities.accountId, activities.type, activities.data)
    .having(sql`count(*) > 1`)
    .limit(limit);
  const uniqueAccountIds = [...new Set(rows.map((r) => r.accountId))];
  return uniqueAccountIds;
}

export async function deleteActivityIds(ids: string[]) {
  console.log("*** Deleting activity IDs ***");
  if (!ids.length) return { deleted: 0 };
  const db = getDb();
  await Promise.all(
    autochunk({ items: ids }, (chunk) =>
      db.delete(activities).where(inArray(activities.id, chunk)),
    ),
  );
  return { deleted: ids.length };
}

export async function getAccountBasic(accountId: string) {
  const db = getDb();
  const rows = await db
    .select({ id: accounts.id, username: accounts.username })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);
  return rows[0];
}

// Lightweight deletion server action for optimistic client usage (no redirects).
export async function deleteActivityIdsAction(ids: string[]) {
  "use server";
  if (!ids.length) return { deleted: 0 };
  await deleteActivityIds(ids);
  return { deleted: ids.length };
}

export async function getAccountActivitiesForTypes(
  accountId: string,
  targetTypes: ActivityEvent["type"][],
) {
  const db = getDb();
  if (!targetTypes.length) return [];
  return db
    .select({
      id: activities.id,
      type: activities.type,
      data: activities.data,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .where(
      and(
        eq(activities.accountId, accountId),
        inArray(activities.type, targetTypes),
      ),
    )
    .orderBy(desc(activities.createdAt));
}

// Revalidate the duplicate activities page (used when starting a fresh batch)
export async function revalidateDupActivities() {
  "use server";
  revalidatePath("/dup-activities");
}
