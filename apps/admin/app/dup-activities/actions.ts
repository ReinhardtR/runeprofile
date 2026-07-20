"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { accounts, activities, withValues } from "@runeprofile/db";
import { ActivityEvent } from "@runeprofile/runescape";

export async function findAccountsWithDuplicateActivities(
  targetTypes: ActivityEvent["type"][],
  limit = 100,
) {
  await requireAdmin();

  console.log("*** Finding accounts with duplicate activities ***");
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
  await requireAdmin();

  console.log("*** Deleting activity IDs ***");
  if (!ids.length) return { deleted: 0 };

  await withValues(ids, (values) =>
    db.delete(activities).where(inArray(activities.id, values)),
  );

  return { deleted: ids.length };
}

export async function getAccountBasic(accountId: string) {
  await requireAdmin();

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
  await requireAdmin();

  if (!ids.length) return { deleted: 0 };
  await deleteActivityIds(ids);
  return { deleted: ids.length };
}

export async function getAccountActivitiesForTypes(
  accountId: string,
  targetTypes: ActivityEvent["type"][],
) {
  await requireAdmin();

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
  await requireAdmin();

  revalidatePath("/dup-activities");
}
