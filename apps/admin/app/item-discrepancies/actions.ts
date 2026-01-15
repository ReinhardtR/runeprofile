"use server";

import { getDb } from "@/lib/db";
import {
  AccountItemDiscrepancy,
  AccountItemDiscrepancyWithDetails,
  ITEM_DISCREPANCY_PREFIX,
  ItemDiscrepancyWithDetails,
} from "@/types/item-discrepancies";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { accounts, activities, items } from "@runeprofile/db";
import { COLLECTION_LOG_ITEMS } from "@runeprofile/runescape";

/**
 * Get all account IDs with item discrepancies from KV using list()
 */
async function getDiscrepancyAccountIds(): Promise<string[]> {
  const { env } = getCloudflareContext();
  const result = await env.KV.list({ prefix: ITEM_DISCREPANCY_PREFIX });

  // Extract account IDs from keys (remove prefix)
  return result.keys.map((key) =>
    key.name.slice(ITEM_DISCREPANCY_PREFIX.length),
  );
}

/**
 * Get a single account's item discrepancy from KV (internal helper)
 */
async function getAccountDiscrepancy(
  accountId: string,
): Promise<AccountItemDiscrepancy | null> {
  const { env } = getCloudflareContext();
  const key = `${ITEM_DISCREPANCY_PREFIX}${accountId}`;
  return env.KV.get<AccountItemDiscrepancy>(key, "json");
}

/**
 * Get all item discrepancies summary (with basic info)
 */
export async function getAllDiscrepancies(): Promise<AccountItemDiscrepancy[]> {
  const accountIds = await getDiscrepancyAccountIds();
  const discrepancies: AccountItemDiscrepancy[] = [];

  for (const accountId of accountIds) {
    const discrepancy = await getAccountDiscrepancy(accountId);
    if (discrepancy) {
      discrepancies.push(discrepancy);
    }
  }

  // Sort by detection date (newest first)
  return discrepancies.sort(
    (a, b) =>
      new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
  );
}

/**
 * Get detailed discrepancy info including item names and associated activities
 */
export async function getDiscrepancyDetails(
  accountId: string,
): Promise<AccountItemDiscrepancyWithDetails | null> {
  const db = getDb();
  const discrepancy = await getAccountDiscrepancy(accountId);

  if (!discrepancy) {
    return null;
  }

  // Get associated new_item_obtained activities for items with realQuantity = 0
  const itemIdsToCheck = discrepancy.items
    .filter((item) => item.realQuantity === 0)
    .map((item) => item.itemId);

  // Find activities that match these item IDs
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

  // Create a map of itemId -> activity for quick lookup
  const activityByItemId = new Map<
    number,
    { id: string; createdAt: string | null }
  >();
  for (const activity of matchingActivities) {
    const data = activity.data as { itemId: number };
    if (data.itemId && itemIdsToCheck.includes(data.itemId)) {
      // If multiple activities exist for same item, keep the most recent
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

  // Build detailed items
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
 * Reconcile discrepancies for an account by:
 * 1. Deleting items that shouldn't exist (realQuantity = 0)
 * 2. Updating quantities for items that have wrong quantities
 * 3. Deleting associated new_item_obtained activities for removed items
 * 4. Removing the discrepancy from KV
 */
export async function reconcileDiscrepancy(accountId: string): Promise<{
  itemsDeleted: number;
  itemsUpdated: number;
  activitiesDeleted: number;
}> {
  const db = getDb();
  const { env } = getCloudflareContext();
  const discrepancy = await getAccountDiscrepancy(accountId);

  if (!discrepancy) {
    throw new Error("No discrepancy found for this account");
  }

  // Separate items to delete vs update
  const itemsToDelete = discrepancy.items.filter(
    (item) => item.realQuantity === 0,
  );
  const itemsToUpdate = discrepancy.items.filter(
    (item) => item.realQuantity > 0,
  );

  // Get activity IDs for items being deleted
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

  // Execute deletions and updates
  const operations: Promise<unknown>[] = [];

  // Delete items
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

  // Update item quantities
  for (const item of itemsToUpdate) {
    operations.push(
      db
        .update(items)
        .set({ quantity: item.realQuantity })
        .where(and(eq(items.accountId, accountId), eq(items.id, item.itemId))),
    );
  }

  // Delete associated activities
  if (activityIdsToDelete.length > 0) {
    operations.push(
      db.delete(activities).where(inArray(activities.id, activityIdsToDelete)),
    );
  }

  await Promise.all(operations);

  // Remove discrepancy from KV (no index to update - we use list() with prefix)
  const key = `${ITEM_DISCREPANCY_PREFIX}${accountId}`;
  await env.KV.delete(key);

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

  // Remove discrepancy from KV (no index to update - we use list() with prefix)
  const key = `${ITEM_DISCREPANCY_PREFIX}${accountId}`;
  await env.KV.delete(key);

  revalidatePath("/item-discrepancies");
}

/**
 * Manually remove specific items from an account (partial reconciliation)
 */
export async function removeDiscrepantItems(
  accountId: string,
  itemIds: number[],
  deleteActivities: boolean = true,
): Promise<{
  itemsDeleted: number;
  activitiesDeleted: number;
}> {
  if (itemIds.length === 0) {
    return { itemsDeleted: 0, activitiesDeleted: 0 };
  }

  const db = getDb();
  const { env } = getCloudflareContext();

  let activitiesDeleted = 0;

  // Delete the items
  await db
    .delete(items)
    .where(and(eq(items.accountId, accountId), inArray(items.id, itemIds)));

  // Optionally delete associated activities
  if (deleteActivities) {
    const activitiesToDelete = await db
      .select({ id: activities.id, data: activities.data })
      .from(activities)
      .where(
        and(
          eq(activities.accountId, accountId),
          eq(activities.type, "new_item_obtained"),
        ),
      );

    const activityIdsToDelete = activitiesToDelete
      .filter((a) => {
        const data = a.data as { itemId: number };
        return itemIds.includes(data.itemId);
      })
      .map((a) => a.id);

    if (activityIdsToDelete.length > 0) {
      await db
        .delete(activities)
        .where(inArray(activities.id, activityIdsToDelete));
      activitiesDeleted = activityIdsToDelete.length;
    }
  }

  // Update the discrepancy in KV to remove reconciled items
  const discrepancy = await getAccountDiscrepancy(accountId);
  if (discrepancy) {
    const remainingItems = discrepancy.items.filter(
      (item) => !itemIds.includes(item.itemId),
    );

    if (remainingItems.length === 0) {
      // All items reconciled, remove the discrepancy
      await dismissDiscrepancy(accountId);
    } else {
      // Update with remaining items
      const key = `${ITEM_DISCREPANCY_PREFIX}${accountId}`;
      await env.KV.put(
        key,
        JSON.stringify({ ...discrepancy, items: remainingItems }),
      );
    }
  }

  revalidatePath("/item-discrepancies");
  revalidatePath(`/item-discrepancies/${encodeURIComponent(accountId)}`);

  return {
    itemsDeleted: itemIds.length,
    activitiesDeleted,
  };
}

/**
 * Get account info by ID
 */
export async function getAccountInfo(accountId: string) {
  const db = getDb();
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
    columns: { id: true, username: true },
  });
  return account;
}
