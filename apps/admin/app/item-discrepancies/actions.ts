"use server";

import { db } from "@/lib/db";
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
  const result = await env.KV.list({
    prefix: ITEM_DISCREPANCY_PREFIX,
    limit: 100,
  });

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
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
    columns: { id: true, username: true },
  });
  return account;
}

// Date range for auto-reconcile (Oct 14 - Nov 13, 2025)
const AUTO_RECONCILE_START = new Date("2025-10-14T00:00:00Z");
const AUTO_RECONCILE_END = new Date("2025-11-13T23:59:59Z");

// Items that are always safe to auto-reconcile (known problematic items)
const AUTO_RECONCILE_WHITELIST = [
  "Chompy bird hat",
  "Decorative sword",
  "Decorative armour",
  "Decorative helm",
  "Decorative shield",
  "Castlewars hood",
  "Castlewars cloak",
  "Rum",
  "Ancient page",
  "Graceful hood",
  "Graceful cape",
  "Graceful top",
  "Graceful legs",
  "Graceful gloves",
  "Graceful boots",
  "Mysterious page",
  "Decorative boots",
  "Decorative full helm",
  "Medallion fragment",
  "Pirate's hook",
];

/**
 * Check if an item is in the whitelist
 */
function isItemInWhitelist(item: ItemDiscrepancyWithDetails): boolean {
  return AUTO_RECONCILE_WHITELIST.some(
    (whitelistItem) => item.itemName === whitelistItem,
  );
}

/**
 * Check if an item's activity date is within the valid date range
 */
function isItemWithinDateRange(item: ItemDiscrepancyWithDetails): boolean {
  if (!item.activityCreatedAt) return true; // No activity date = allowed
  const date = new Date(item.activityCreatedAt);
  return date >= AUTO_RECONCILE_START && date <= AUTO_RECONCILE_END;
}

/**
 * Check if account meets auto-reconcile criteria:
 * Each item must either be in the whitelist OR have a date within the range
 */
function canAutoReconcile(details: AccountItemDiscrepancyWithDetails): boolean {
  if (details.items.length === 0) return false;

  return details.items.every(
    (item) => isItemInWhitelist(item) || isItemWithinDateRange(item),
  );
}

/**
 * Get reasons why an account cannot be auto-reconciled
 */
function getAutoReconcileFailureReasons(
  details: AccountItemDiscrepancyWithDetails,
): string[] {
  const reasons: string[] = [];
  const failingItems = details.items.filter(
    (item) => !isItemInWhitelist(item) && !isItemWithinDateRange(item),
  );

  if (failingItems.length > 0) {
    const itemNames = failingItems.map((i) => i.itemName).slice(0, 3);
    const suffix =
      failingItems.length > 3 ? ` and ${failingItems.length - 3} more` : "";
    reasons.push(
      `items not matching criteria: ${itemNames.join(", ")}${suffix}`,
    );
  }

  return reasons;
}

/**
 * Get details and reconcile in one call (for auto-mode to reduce DB connections)
 * Returns details if not reconciled, or reconcile result if reconciled
 */
export async function getDetailsAndMaybeReconcile(accountId: string): Promise<
  | { action: "skipped"; reason: string }
  | {
      action: "paused";
      details: AccountItemDiscrepancyWithDetails;
      reasons: string[];
    }
  | {
      action: "reconciled";
      result: {
        itemsDeleted: number;
        itemsUpdated: number;
        activitiesDeleted: number;
      };
    }
> {
  const { env } = getCloudflareContext();
  const discrepancy = await getAccountDiscrepancy(accountId);

  if (!discrepancy) {
    return { action: "skipped", reason: "No discrepancy found" };
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

  const details: AccountItemDiscrepancyWithDetails = {
    ...discrepancy,
    items: itemsWithDetails,
  };

  // Check if we should auto-reconcile
  if (!canAutoReconcile(details)) {
    const reasons = getAutoReconcileFailureReasons(details);
    return { action: "paused", details, reasons };
  }

  // Perform reconciliation using existing DB connection
  const itemsToDelete = discrepancy.items.filter(
    (item) => item.realQuantity === 0,
  );
  const itemsToUpdate = discrepancy.items.filter(
    (item) => item.realQuantity > 0,
  );

  const itemIdsToDelete = itemsToDelete.map((item) => item.itemId);

  const activityIdsToDelete = matchingActivities
    .filter((a) => {
      const data = a.data as { itemId: number };
      return itemIdsToDelete.includes(data.itemId);
    })
    .map((a) => a.id);

  // Execute deletions and updates
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

  // Remove discrepancy from KV
  const key = `${ITEM_DISCREPANCY_PREFIX}${accountId}`;
  await env.KV.delete(key);

  revalidatePath("/item-discrepancies");

  return {
    action: "reconciled",
    result: {
      itemsDeleted: itemsToDelete.length,
      itemsUpdated: itemsToUpdate.length,
      activitiesDeleted: activityIdsToDelete.length,
    },
  };
}
