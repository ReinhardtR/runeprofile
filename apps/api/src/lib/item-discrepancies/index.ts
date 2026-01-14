import type { Profile } from "~/lib/profiles/get-profile";
import type { UpdateProfileInput } from "~/lib/profiles/get-profile-updates";

// ============================================================================
// Types
// ============================================================================

/** Represents an item discrepancy between input data and stored data */
export type ItemDiscrepancy = {
  itemId: number;
  /** Quantity from the input data (0 if item was not in input) */
  realQuantity: number;
  /** Quantity stored in the database */
  storedQuantity: number;
};

/** Represents an account with item discrepancies */
export type AccountItemDiscrepancy = {
  accountId: string;
  username: string;
  /** Items that have discrepancies */
  items: ItemDiscrepancy[];
  /** When the discrepancy was detected */
  detectedAt: string;
  /** Total items in input (for reference) */
  inputItemCount: number;
  /** Total items in database (for reference) */
  storedItemCount: number;
};

/** KV key prefix for item discrepancies */
const ITEM_DISCREPANCY_PREFIX = "item-discrepancy:";

/** KV key for the list of account IDs with discrepancies */
const ITEM_DISCREPANCY_INDEX_KEY = "item-discrepancy-index";

// ============================================================================
// Detection
// ============================================================================

/**
 * Minimum number of items required in the input to be considered a "full" update.
 * Small batches (autosync) with fewer items are ignored.
 */
const MINIMUM_FULL_UPDATE_ITEMS = 20;

/**
 * Detects item discrepancies between input data and stored profile data.
 *
 * Only runs for "full" updates (20+ items in input) to avoid false positives
 * from autosync which sends small batches.
 *
 * Detects:
 * - Items in the database that are NOT in the input (input quantity = 0)
 * - Items in the database with higher quantity than in the input
 *
 * @returns AccountItemDiscrepancy if discrepancies found, null otherwise
 */
export function detectItemDiscrepancies(
  input: UpdateProfileInput,
  profile: Profile | null,
): AccountItemDiscrepancy | null {
  // Can't detect discrepancies without a profile to compare against
  if (!profile) {
    return null;
  }

  // Get non-zero items from input
  const inputItems = Object.entries(input.items)
    .filter(([_, quantity]) => quantity > 0)
    .map(([id, quantity]) => ({ id: parseInt(id, 10), quantity }));

  // Skip if this is a small/autosync update
  if (inputItems.length < MINIMUM_FULL_UPDATE_ITEMS) {
    return null;
  }

  // Create a map for fast lookup of input items
  const inputItemsMap = new Map(
    inputItems.map((item) => [item.id, item.quantity]),
  );

  const discrepancies: ItemDiscrepancy[] = [];

  // Check each stored item against input
  for (const storedItem of profile.items) {
    const inputQuantity = inputItemsMap.get(storedItem.id);

    if (inputQuantity === undefined) {
      // Item exists in DB but not in input - it's a discrepancy
      discrepancies.push({
        itemId: storedItem.id,
        realQuantity: 0,
        storedQuantity: storedItem.quantity,
      });
    } else if (inputQuantity < storedItem.quantity) {
      // Item exists in both but input has lower quantity
      discrepancies.push({
        itemId: storedItem.id,
        realQuantity: inputQuantity,
        storedQuantity: storedItem.quantity,
      });
    }
  }

  // If no discrepancies found, return null
  if (discrepancies.length === 0) {
    return null;
  }

  return {
    accountId: input.id,
    username: input.username,
    items: discrepancies,
    detectedAt: new Date().toISOString(),
    inputItemCount: inputItems.length,
    storedItemCount: profile.items.length,
  };
}

// ============================================================================
// Storage
// ============================================================================

/**
 * Stores an item discrepancy in KV storage.
 *
 * Uses two keys:
 * 1. Individual discrepancy: item-discrepancy:{accountId}
 * 2. Index of all account IDs with discrepancies: item-discrepancy-index
 *
 * @param kv - The KV namespace
 * @param discrepancy - The discrepancy to store
 */
export async function storeItemDiscrepancy(
  kv: KVNamespace,
  discrepancy: AccountItemDiscrepancy,
): Promise<void> {
  const key = `${ITEM_DISCREPANCY_PREFIX}${discrepancy.accountId}`;

  // Store the discrepancy (overwrites any existing)
  await kv.put(key, JSON.stringify(discrepancy));

  // Update the index
  const indexStr = await kv.get(ITEM_DISCREPANCY_INDEX_KEY);
  const index: string[] = indexStr ? JSON.parse(indexStr) : [];

  if (!index.includes(discrepancy.accountId)) {
    index.push(discrepancy.accountId);
    await kv.put(ITEM_DISCREPANCY_INDEX_KEY, JSON.stringify(index));
  }
}
