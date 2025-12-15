"use server";

import { getDb } from "@/lib/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { accounts, items } from "@runeprofile/db";

export async function getAccountItems(
  accountId: string,
  page: number = 1,
  pageSize: number = 50,
  searchItemId?: string,
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

  // Build where conditions
  const whereConditions = [eq(items.accountId, accountId)];
  if (searchItemId) {
    const itemIdNum = parseInt(searchItemId, 10);
    if (!isNaN(itemIdNum)) {
      whereConditions.push(eq(items.id, itemIdNum));
    }
  }

  // Get items with pagination
  const itemsQuery = db
    .select({
      id: items.id,
      quantity: items.quantity,
      createdAt: items.createdAt,
    })
    .from(items)
    .where(and(...whereConditions))
    .orderBy(desc(items.id)) // Order by item ID descending
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

  const db = getDb();

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

  revalidatePath(`/accounts/${accountId}/items`);
  return { deleted: validItemIds.length };
}

export async function updateItemQuantity(
  accountId: string,
  itemId: number,
  newQuantity: number,
) {
  const db = getDb();

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

  revalidatePath(`/accounts/${accountId}/items`);
  return { success: true };
}

export async function clearAllAccountItems(accountId: string) {
  const db = getDb();

  // Delete all items for this account
  await db.delete(items).where(eq(items.accountId, accountId));

  revalidatePath(`/accounts/${accountId}/items`);
}

export async function getItemStats(accountId: string) {
  const db = getDb();

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
