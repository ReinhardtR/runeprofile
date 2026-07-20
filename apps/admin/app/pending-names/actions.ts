"use server";

import { db } from "@/lib/db";
import { invalidateDiffCache } from "@/lib/invalidate-diff-cache";
import { requireAdmin } from "@/lib/require-admin";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { aliasedTable, and, eq, isNotNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { accounts, lower } from "@runeprofile/db";
import { placeholderUsername } from "@runeprofile/runescape";

export type PendingNameRow = {
  id: string;
  username: string;
  pendingUsername: string;
  updatedAt: string;
  holderUsername: string | null;
  holderUpdatedAt: string | null;
};

export async function getPendingNames(): Promise<PendingNameRow[]> {
  await requireAdmin();

  const holder = aliasedTable(accounts, "holder");
  const rows = await db
    .select({
      id: accounts.id,
      username: accounts.username,
      pendingUsername: accounts.pendingUsername,
      updatedAt: accounts.updatedAt,
      holderUsername: holder.username,
      holderUpdatedAt: holder.updatedAt,
    })
    .from(accounts)
    .leftJoin(
      holder,
      and(
        eq(lower(holder.username), lower(accounts.pendingUsername)),
        ne(holder.id, accounts.id),
      ),
    )
    .where(isNotNull(accounts.pendingUsername))
    // Free names first (grantable without archiving anyone), then the holders
    // that have been dead the longest.
    .orderBy(sql`${holder.updatedAt} ASC NULLS FIRST`);

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
 */
export async function resolvePendingName(claimantId: string) {
  await requireAdmin();

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

  const holder = await db.query.accounts.findFirst({
    where: and(
      eq(lower(accounts.username), wanted.toLowerCase()),
      ne(accounts.id, claimant.id),
    ),
    columns: { id: true, username: true },
  });

  const holderPlaceholder = placeholderUsername();

  await db.transaction(async (tx) => {
    if (holder) {
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
          and(eq(accounts.id, holder.id), eq(accounts.username, holder.username)),
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
        and(
          eq(accounts.id, claimant.id),
          eq(accounts.pendingUsername, wanted),
        ),
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
    ...(holder
      ? [
          renameModelFiles(bucket, holder.username, holderPlaceholder),
          invalidateDiffCache(holder.id),
        ]
      : []),
  ]);

  revalidatePath("/pending-names");
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
    .where(and(eq(accounts.id, claimantId), isNotNull(accounts.pendingUsername)));

  revalidatePath("/pending-names");
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
