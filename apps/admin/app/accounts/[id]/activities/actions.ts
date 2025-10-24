"use server";

import { getDb } from "@/lib/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { accounts, activities, autochunk } from "@runeprofile/db";

export async function getAccountActivities(
  accountId: string,
  page: number = 1,
  pageSize: number = 50,
) {
  const db = getDb();
  const offset = (page - 1) * pageSize;

  // Get account info first
  console.log("Looking for account with ID:", accountId);
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
    columns: { id: true, username: true },
  });

  console.log("Found account:", account);
  if (!account) {
    throw new Error(`Account not found with ID: ${accountId}`);
  }

  // Get activities with pagination
  const activitiesQuery = db
    .select({
      id: activities.id,
      type: activities.type,
      data: activities.data,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .where(eq(activities.accountId, accountId))
    .orderBy(desc(activities.createdAt))
    .limit(pageSize + 1) // Fetch one extra to check if there are more
    .offset(offset);

  const results = await activitiesQuery;

  // Check if there are more results
  const hasMore = results.length > pageSize;
  const activitiesPage = hasMore ? results.slice(0, pageSize) : results;

  // Get total count for the first page
  let totalCount = 0;
  if (page === 1) {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(eq(activities.accountId, accountId));
    totalCount = countResult[0]?.count || 0;
  }

  return {
    account,
    activities: activitiesPage,
    totalCount,
    hasMore,
    currentPage: page,
  };
}

export async function deleteAccountActivities(
  accountId: string,
  activityIds: string[],
) {
  if (!activityIds.length) {
    return { deleted: 0 };
  }

  const db = getDb();

  // Verify all activities belong to the account (security check)
  const activityCheck = await db
    .select({ id: activities.id })
    .from(activities)
    .where(
      and(
        eq(activities.accountId, accountId),
        inArray(activities.id, activityIds),
      ),
    );

  const validActivityIds = activityCheck.map((a) => a.id);

  if (validActivityIds.length !== activityIds.length) {
    throw new Error("Some activities do not belong to this account");
  }

  // Delete activities in chunks
  await Promise.all(
    autochunk({ items: validActivityIds }, (chunk) =>
      db.delete(activities).where(inArray(activities.id, chunk)),
    ),
  );

  revalidatePath(`/accounts/${accountId}/activities`);
  return { deleted: validActivityIds.length };
}

export async function getActivityTypeStats(accountId: string) {
  const db = getDb();

  // Get activities count by type for this account
  const typeStatsResult = await db
    .select({
      type: activities.type,
      count: sql<number>`count(*)`,
    })
    .from(activities)
    .where(eq(activities.accountId, accountId))
    .groupBy(activities.type)
    .orderBy(desc(sql<number>`count(*)`));

  return typeStatsResult;
}
