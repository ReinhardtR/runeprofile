import { db } from "@/lib/db";
import { invalidateDiffCache } from "@/lib/invalidate-diff-cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { aliasedTable, and, eq, isNotNull, ne, sql } from "drizzle-orm";

import { accounts, lower } from "@runeprofile/db";
import { placeholderUsername } from "@runeprofile/runescape";

import { type PendingNameRow, STALE_HOLDER_DAYS } from "./pending-names";

export const holder = aliasedTable(accounts, "holder");

/** Join condition: the row currently holding `accounts.pendingUsername`. */
export const holderJoin = and(
  eq(lower(holder.username), lower(accounts.pendingUsername)),
  ne(holder.id, accounts.id),
);

export const pendingNameFields = {
  id: accounts.id,
  username: accounts.username,
  pendingUsername: accounts.pendingUsername,
  updatedAt: accounts.updatedAt,
  holderUsername: holder.username,
  holderUpdatedAt: holder.updatedAt,
};

/** Pending claims whose holder has not synced for STALE_HOLDER_DAYS. */
export async function findStalePendingNames(limit: number) {
  const rows = await db
    .select(pendingNameFields)
    .from(accounts)
    .innerJoin(holder, holderJoin)
    .where(
      and(
        isNotNull(accounts.pendingUsername),
        sql`${holder.updatedAt} < now() - make_interval(days => ${STALE_HOLDER_DAYS})`,
      ),
    )
    .orderBy(sql`${holder.updatedAt} ASC`)
    .limit(limit);
  return rows as PendingNameRow[];
}

/**
 * Grants an account its pending username. If another row still holds the name,
 * it is archived under a placeholder first (same convention as the Archive
 * button) — only use this when you're confident the holder is a stale row.
 *
 * Mirrors the API's rename bookkeeping: R2 models move with the username and
 * both diff caches are invalidated. No freed-name cascade is needed here — a
 * row pending on the claimant's old name picks it up on its own next sync.
 *
 * Callers are responsible for `requireAdmin()`.
 */
export async function grantPendingName(claimantId: string) {
  const claimant = await db.query.accounts.findFirst({
    where: eq(accounts.id, claimantId),
    columns: { id: true, username: true, pendingUsername: true },
  });
  if (!claimant) {
    throw new Error("Account not found");
  }
  const wanted = claimant.pendingUsername;
  if (!wanted) {
    throw new Error("Account has no pending username");
  }

  const current = await db.query.accounts.findFirst({
    where: and(
      eq(lower(accounts.username), wanted.toLowerCase()),
      ne(accounts.id, claimant.id),
    ),
    columns: { id: true, username: true },
  });

  const holderPlaceholder = placeholderUsername();

  await db.transaction(async (tx) => {
    if (current) {
      // Free the name first so the unique index never collides mid-move.
      const archived = await tx
        .update(accounts)
        .set({
          username: holderPlaceholder,
          clanName: null,
          clanRank: null,
          clanIcon: null,
          clanTitle: null,
          groupName: null,
        })
        .where(
          and(
            eq(accounts.id, current.id),
            eq(accounts.username, current.username),
          ),
        )
        .returning({ id: accounts.id });
      if (archived.length === 0) {
        throw new Error("Holder row changed concurrently, aborting");
      }
    }

    const granted = await tx
      .update(accounts)
      .set({ username: wanted, pendingUsername: null })
      .where(
        and(eq(accounts.id, claimant.id), eq(accounts.pendingUsername, wanted)),
      )
      .returning({ id: accounts.id });
    if (granted.length === 0) {
      throw new Error("Claimant row changed concurrently, aborting");
    }
  });

  const bucket = getCloudflareContext().env.BUCKET;
  await Promise.all([
    renameModelFiles(bucket, claimant.username, wanted),
    invalidateDiffCache(claimant.id),
    ...(current
      ? [
          renameModelFiles(bucket, current.username, holderPlaceholder),
          invalidateDiffCache(current.id),
        ]
      : []),
  ]);
}

async function renameModelFiles(
  bucket: R2Bucket,
  oldUsername: string,
  newUsername: string,
) {
  const oldKey = oldUsername.toLowerCase();
  const newKey = newUsername.toLowerCase();
  if (oldKey === newKey) return;

  try {
    await Promise.all([
      renameFile(bucket, oldKey, newKey),
      renameFile(bucket, `${oldKey}-pet`, `${newKey}-pet`),
    ]);
  } catch {
    console.error("Failed to rename model files");
  }
}

async function renameFile(bucket: R2Bucket, oldKey: string, newKey: string) {
  const file = await bucket.get(oldKey);
  if (!file) return;
  const data = await file.arrayBuffer();
  await bucket.put(newKey, data);
  await bucket.delete(oldKey);
}
