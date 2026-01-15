/**
 * Represents an item discrepancy between input data and stored data
 */
export type ItemDiscrepancy = {
  itemId: number;
  /** Quantity from the input data (0 if item was not in input) */
  realQuantity: number;
  /** Quantity stored in the database */
  storedQuantity: number;
};

/**
 * Represents an account with item discrepancies
 */
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
export const ITEM_DISCREPANCY_PREFIX = "item-discrepancy:";

/** Extended item discrepancy with item name and related activity */
export type ItemDiscrepancyWithDetails = ItemDiscrepancy & {
  itemName: string;
  /** Activity ID if this item has an associated new_item_obtained activity */
  activityId?: string;
  activityCreatedAt?: string;
};

/** Account discrepancy with enhanced item details */
export type AccountItemDiscrepancyWithDetails = Omit<
  AccountItemDiscrepancy,
  "items"
> & {
  items: ItemDiscrepancyWithDetails[];
};
