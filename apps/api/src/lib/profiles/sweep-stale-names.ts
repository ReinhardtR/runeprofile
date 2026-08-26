import { aliasedTable, and, eq, gt, isNotNull, ne, sql } from "drizzle-orm";

import { Database, accounts, lower } from "@runeprofile/db";
import { STALE_HOLDER_DAYS } from "@runeprofile/runescape";

import { renamePlayerModels } from "~/lib/models/manage-models";
import { deleteDiffProfileCache } from "~/lib/profiles/diff-cache";
import {
  cascadeFreedName,
  resolveUsername,
} from "~/lib/profiles/resolve-username";

// Each grant is a transaction plus R2 moves and KV deletes; keep one run well
// inside Worker limits. Anything left over is picked up by the next run.
const SWEEP_BATCH_SIZE = 50;

export type SweepResult = {
  granted: { accountId: string; from: string; to: string }[];
  skipped: number;
  failed: number;
};

/**
 * Settles pending usernames whose holder has gone stale since the claim was
 * parked. The sync path already evicts a stale holder at claim time; this
 * catches claims that were parked while the holder was still within the
 * window and whose claimant has not synced since.
 *
 * Each claim is replayed through `resolveUsername` exactly as if the claimant
 * had synced its pending name, so the sweep cannot do anything a sync could
 * not. A claim is only replayed when it is newer than the holder's last sync —
 * the claim must be the more recent sighting of the name.
 */
export async function sweepStalePendingNames(
  db: Database,
  bucket: R2Bucket,
  kv: KVNamespace,
): Promise<SweepResult> {
  const holder = aliasedTable(accounts, "holder");
  const claims = await db
    .select({
      id: accounts.id,
      username: accounts.username,
      pendingUsername: accounts.pendingUsername,
    })
    .from(accounts)
    .innerJoin(
      holder,
      and(
        eq(lower(holder.username), lower(accounts.pendingUsername)),
        ne(holder.id, accounts.id),
      ),
    )
    .where(
      and(
        isNotNull(accounts.pendingUsername),
        sql`${holder.updatedAt} < now() - ${sql.raw(`interval '${STALE_HOLDER_DAYS} days'`)}`,
        gt(accounts.updatedAt, holder.updatedAt),
      ),
    )
    .orderBy(sql`${holder.updatedAt} ASC`)
    .limit(SWEEP_BATCH_SIZE);

  const result: SweepResult = { granted: [], skipped: 0, failed: 0 };

  for (const claim of claims) {
    const wanted = claim.pendingUsername!;
    try {
      const resolution = await resolveUsername(db, bucket, kv, {
        id: claim.id,
        reportedUsername: wanted,
        currentUsername: claim.username,
      });

      if (resolution.pendingUsername !== null) {
        // Holder came back to life (or a chain we cannot settle); leave it.
        result.skipped++;
        continue;
      }

      // resolveUsername leaves the claimant's own row to the caller (it may
      // already carry the new name from an in-transaction move); apply the
      // resolution the way the profile update does, minus activity bookkeeping.
      await db
        .update(accounts)
        .set({ username: resolution.username, pendingUsername: null })
        .where(eq(accounts.id, claim.id));

      await Promise.all([
        deleteDiffProfileCache(kv, claim.id).catch((error) => {
          console.error(`Failed to delete diff cache for ${claim.id}:`, error);
        }),
        renamePlayerModels(bucket, claim.username, resolution.username).catch(
          (error) => {
            console.error(
              `Failed to rename player models for ${claim.id}:`,
              error,
            );
          },
        ),
      ]);

      if (resolution.freedName) {
        await cascadeFreedName(db, bucket, kv, resolution.freedName);
      }

      result.granted.push({
        accountId: claim.id,
        from: claim.username,
        to: resolution.username,
      });
    } catch (error) {
      result.failed++;
      console.error(`Stale-name sweep failed for ${claim.id}:`, error);
    }
  }

  console.log({
    event: "stale-pending-names-swept",
    candidates: claims.length,
    granted: result.granted.length,
    skipped: result.skipped,
    failed: result.failed,
  });

  return result;
}
