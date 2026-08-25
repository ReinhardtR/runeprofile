"use server";

import { db } from "@/lib/db";
import { type PendingNameRow } from "@/lib/pending-names";
import {
  findStalePendingNames,
  grantPendingName,
  holder,
  holderJoin,
  pendingNameFields,
} from "@/lib/pending-names.server";
import { requireAdmin } from "@/lib/require-admin";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { accounts } from "@runeprofile/db";

export async function getPendingNames(): Promise<PendingNameRow[]> {
  await requireAdmin();

  const rows = await db
    .select(pendingNameFields)
    .from(accounts)
    .leftJoin(holder, holderJoin)
    .where(isNotNull(accounts.pendingUsername))
    // Free names first (grantable without archiving anyone), then the holders
    // that have been dead the longest.
    .orderBy(sql`${holder.updatedAt} ASC NULLS FIRST`);

  return rows as PendingNameRow[];
}

/** See `grantPendingName`. */
export async function resolvePendingName(claimantId: string) {
  await requireAdmin();

  await grantPendingName(claimantId);

  revalidatePath("/pending-names");
  revalidatePath("/accounts");
}

// Each grant costs a transaction plus up to four R2 moves and two KV deletes;
// keep one action well inside Worker subrequest/CPU limits.
const STALE_BATCH_SIZE = 25;

export type ResolveStaleResult = {
  resolved: { username: string; pendingUsername: string }[];
  failed: { username: string; pendingUsername: string; error: string }[];
  /** Stale claims still left after this batch (0 when finished). */
  remaining: number;
};

/**
 * Grants every pending name whose holder has been inactive for at least
 * STALE_HOLDER_DAYS, one batch at a time. Claims are processed sequentially so
 * a chain (A wants B's name, B wants C's) settles in order.
 */
export async function resolveStalePendingNames(): Promise<ResolveStaleResult> {
  await requireAdmin();

  const batch = await findStalePendingNames(STALE_BATCH_SIZE);
  const result: ResolveStaleResult = { resolved: [], failed: [], remaining: 0 };

  for (const row of batch) {
    try {
      await grantPendingName(row.id);
      result.resolved.push({
        username: row.username,
        pendingUsername: row.pendingUsername,
      });
    } catch (err) {
      result.failed.push({
        username: row.username,
        pendingUsername: row.pendingUsername,
        error: err instanceof Error ? err.message : "Failed to resolve",
      });
    }
  }

  const remaining = await findStalePendingNames(STALE_BATCH_SIZE + 1);
  // Rows that failed this round would be counted again; report only new work.
  result.remaining = Math.max(0, remaining.length - result.failed.length);

  console.log({
    event: "stale-pending-names-resolved",
    resolved: result.resolved.length,
    failed: result.failed.length,
    remaining: result.remaining,
  });

  revalidatePath("/pending-names");
  revalidatePath("/accounts");
  return result;
}

/**
 * Drops a pending claim without granting it. If the claimant's plugin still
 * reports the same name, the claim reappears on its next sync.
 */
export async function clearPendingName(claimantId: string) {
  await requireAdmin();

  await db
    .update(accounts)
    .set({ pendingUsername: null })
    .where(
      and(eq(accounts.id, claimantId), isNotNull(accounts.pendingUsername)),
    );

  revalidatePath("/pending-names");
  revalidatePath("/accounts");
}
