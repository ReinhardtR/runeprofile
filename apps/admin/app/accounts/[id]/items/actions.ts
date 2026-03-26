"use server";

import { db } from "@/lib/db";
import { invalidateDiffCache } from "@/lib/invalidate-diff-cache";
import {
  AccountItemDiscrepancy,
  AccountItemDiscrepancyWithDetails,
  ITEM_DISCREPANCY_PREFIX,
  ItemDiscrepancyWithDetails,
} from "@/types/item-discrepancies";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { accounts, activities, items } from "@runeprofile/db";
import { COLLECTION_LOG_ITEMS } from "@runeprofile/runescape";

export async function getAccountItems(
  accountId: string,
  page: number = 1,
  pageSize: number = 50,
  searchItemId?: string,
  sortBy: string = "id",
) {
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

  // Build where conditions
  const whereConditions = [eq(items.accountId, accountId)];
  if (searchItemId) {
    const itemIdNum = parseInt(searchItemId, 10);
    if (!isNaN(itemIdNum)) {
      whereConditions.push(eq(items.id, itemIdNum));
    }
  }

  // Get items with pagination
  const orderByColumn = sortBy === "createdAt" ? items.createdAt : items.id;
  const itemsQuery = db
    .select({
      id: items.id,
      quantity: items.quantity,
      createdAt: items.createdAt,
    })
    .from(items)
    .where(and(...whereConditions))
    .orderBy(desc(orderByColumn)) // Order by selected column descending
    .limit(pageSize + 1) // Fetch one extra to check if there are more
    .offset(offset);

  const results = await itemsQuery;

  // Check if there are more results
  const hasMore = results.length > pageSize;
  const itemsPage = hasMore ? results.slice(0, pageSize) : results;

  // Get total count for the first page
  let totalCount = 0;
  if (page === 1) {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(...whereConditions));
    totalCount = countResult[0]?.count || 0;
  }

  return {
    account,
    items: itemsPage,
    totalCount,
    hasMore,
    currentPage: page,
  };
}

export async function deleteAccountItems(accountId: string, itemIds: number[]) {
  if (!itemIds.length) {
    return { deleted: 0 };
  }

  // Verify all items belong to the account (security check)
  const itemCheck = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.accountId, accountId), inArray(items.id, itemIds)));

  const validItemIds = itemCheck.map((i) => i.id);

  if (validItemIds.length !== itemIds.length) {
    throw new Error("Some items do not belong to this account");
  }

  // Delete items
  await db
    .delete(items)
    .where(
      and(eq(items.accountId, accountId), inArray(items.id, validItemIds)),
    );

  await invalidateDiffCache(accountId);

  revalidatePath(`/accounts/${accountId}/items`);
  return { deleted: validItemIds.length };
}

export async function updateItemQuantity(
  accountId: string,
  itemId: number,
  newQuantity: number,
) {
  if (newQuantity <= 0) {
    // If quantity is 0 or negative, delete the item
    await db
      .delete(items)
      .where(and(eq(items.accountId, accountId), eq(items.id, itemId)));
  } else {
    // Update the quantity
    await db
      .update(items)
      .set({ quantity: newQuantity })
      .where(and(eq(items.accountId, accountId), eq(items.id, itemId)));
  }

  await invalidateDiffCache(accountId);

  revalidatePath(`/accounts/${accountId}/items`);
  return { success: true };
}

export async function clearAllAccountItems(accountId: string) {
  // Delete all items for this account
  await db.delete(items).where(eq(items.accountId, accountId));

  await invalidateDiffCache(accountId);

  revalidatePath(`/accounts/${accountId}/items`);
}

export async function getItemStats(accountId: string) {
  // Get total items and total quantity
  const statsResult = await db
    .select({
      totalItems: sql<number>`count(*)`,
      totalQuantity: sql<number>`sum(${items.quantity})`,
    })
    .from(items)
    .where(eq(items.accountId, accountId));

  return {
    totalItems: statsResult[0]?.totalItems || 0,
    totalQuantity: statsResult[0]?.totalQuantity || 0,
  };
}

/**
 * Get the item discrepancy record for an account from KV (if any)
 */
export async function getAccountDiscrepancy(
  accountId: string,
): Promise<AccountItemDiscrepancy | null> {
  const { env } = getCloudflareContext();
  const key = `${ITEM_DISCREPANCY_PREFIX}${accountId}`;
  return env.KV.get<AccountItemDiscrepancy>(key, "json");
}

/**
 * Get detailed discrepancy info including item names and associated activities
 */
export async function getDiscrepancyDetails(
  accountId: string,
): Promise<AccountItemDiscrepancyWithDetails | null> {
  const discrepancy = await getAccountDiscrepancy(accountId);

  if (!discrepancy) {
    return null;
  }

  // Get associated new_item_obtained activities for items with realQuantity = 0
  const itemIdsToCheck = discrepancy.items
    .filter((item) => item.realQuantity === 0)
    .map((item) => item.itemId);

  const matchingActivities =
    itemIdsToCheck.length > 0
      ? await db
          .select({
            id: activities.id,
            data: activities.data,
            createdAt: activities.createdAt,
          })
          .from(activities)
          .where(
            and(
              eq(activities.accountId, accountId),
              eq(activities.type, "new_item_obtained"),
            ),
          )
      : [];

  const activityByItemId = new Map<
    number,
    { id: string; createdAt: string | null }
  >();
  for (const activity of matchingActivities) {
    const data = activity.data as { itemId: number };
    if (data.itemId && itemIdsToCheck.includes(data.itemId)) {
      const existing = activityByItemId.get(data.itemId);
      if (
        !existing ||
        (activity.createdAt &&
          new Date(activity.createdAt) > new Date(existing.createdAt || ""))
      ) {
        activityByItemId.set(data.itemId, {
          id: activity.id,
          createdAt: activity.createdAt,
        });
      }
    }
  }

  const itemsWithDetails: ItemDiscrepancyWithDetails[] = discrepancy.items.map(
    (item) => {
      const activity = activityByItemId.get(item.itemId);
      return {
        ...item,
        itemName:
          COLLECTION_LOG_ITEMS[item.itemId] || `Unknown Item (${item.itemId})`,
        activityId: activity?.id,
        activityCreatedAt: activity?.createdAt || undefined,
      };
    },
  );

  return {
    ...discrepancy,
    items: itemsWithDetails,
  };
}

/**
 * Reconcile all discrepancies for an account:
 * 1. Delete items where realQuantity = 0
 * 2. Update quantities for mismatched items
 * 3. Delete associated activities for removed items
 * 4. Remove the discrepancy from KV
 */
export async function reconcileDiscrepancy(accountId: string): Promise<{
  itemsDeleted: number;
  itemsUpdated: number;
  activitiesDeleted: number;
}> {
  const { env } = getCloudflareContext();
  const discrepancy = await getAccountDiscrepancy(accountId);

  if (!discrepancy) {
    throw new Error("No discrepancy found for this account");
  }

  const itemsToDelete = discrepancy.items.filter(
    (item) => item.realQuantity === 0,
  );
  const itemsToUpdate = discrepancy.items.filter(
    (item) => item.realQuantity > 0,
  );

  const itemIdsToDelete = itemsToDelete.map((item) => item.itemId);
  const activitiesToDelete =
    itemIdsToDelete.length > 0
      ? await db
          .select({ id: activities.id, data: activities.data })
          .from(activities)
          .where(
            and(
              eq(activities.accountId, accountId),
              eq(activities.type, "new_item_obtained"),
            ),
          )
      : [];

  const activityIdsToDelete = activitiesToDelete
    .filter((a) => {
      const data = a.data as { itemId: number };
      return itemIdsToDelete.includes(data.itemId);
    })
    .map((a) => a.id);

  const operations: Promise<unknown>[] = [];

  if (itemIdsToDelete.length > 0) {
    operations.push(
      db
        .delete(items)
        .where(
          and(
            eq(items.accountId, accountId),
            inArray(items.id, itemIdsToDelete),
          ),
        ),
    );
  }

  for (const item of itemsToUpdate) {
    operations.push(
      db
        .update(items)
        .set({ quantity: item.realQuantity })
        .where(and(eq(items.accountId, accountId), eq(items.id, item.itemId))),
    );
  }

  if (activityIdsToDelete.length > 0) {
    operations.push(
      db.delete(activities).where(inArray(activities.id, activityIdsToDelete)),
    );
  }

  await Promise.all(operations);

  const key = `${ITEM_DISCREPANCY_PREFIX}${accountId}`;
  await env.KV.delete(key);

  await invalidateDiffCache(accountId);

  revalidatePath(`/accounts/${accountId}/items`);
  revalidatePath("/item-discrepancies");

  return {
    itemsDeleted: itemsToDelete.length,
    itemsUpdated: itemsToUpdate.length,
    activitiesDeleted: activityIdsToDelete.length,
  };
}

/**
 * Dismiss a discrepancy without taking action (removes from KV)
 */
export async function dismissDiscrepancy(accountId: string): Promise<void> {
  const { env } = getCloudflareContext();
  const key = `${ITEM_DISCREPANCY_PREFIX}${accountId}`;
  await env.KV.delete(key);

  revalidatePath(`/accounts/${accountId}/items`);
  revalidatePath("/item-discrepancies");
}
