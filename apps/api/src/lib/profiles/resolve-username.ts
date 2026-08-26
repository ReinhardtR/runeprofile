import { and, eq, ne } from "drizzle-orm";

import { Database, accounts, lower } from "@runeprofile/db";
import {
  isPlaceholderUsername,
  isStaleHolder,
  placeholderUsername,
} from "@runeprofile/runescape";

import { renamePlayerModels } from "~/lib/models/manage-models";
import { deleteDiffProfileCache } from "~/lib/profiles/diff-cache";

/**
 * "Waiting list" username resolution.
 *
 * Usernames are unique, but profiles are keyed by account id — when players
 * swap names between accounts, the reported name can still be held by another
 * (stale) row. Instead of failing the sync, the row keeps its current name and
 * records the reported name as pending. Pending names are granted the moment
 * their holder moves off them:
 *  - unwind: the chain of "holder wants X, X's holder wants Y, ..." ends at a
 *    free name, so every row in the chain can move at once.
 *  - rotation: the chain leads back to the claimant's own name (a swap), so
 *    all names in the cycle rotate at once.
 *  - cascade: after a row moves off a name, any row pending on that name is
 *    granted it (repeated until no more grants).
 *  - evict: the chain ends at a holder that has not synced for
 *    STALE_HOLDER_DAYS. The plugin reports the real in-game name, so the
 *    claimant provably owns it now; the stale holder is archived under a
 *    placeholder and the chain settles as an unwind.
 *
 * Otherwise a name is only ever taken from a row by that row's own account
 * reporting a different name — never by another account — so an active
 * player's name cannot be stolen.
 */

export type UsernameResolution = {
  // What the claimant's row should hold after this sync.
  username: string;
  pendingUsername: string | null;
  // The name the claimant is moving off of, if any — used to cascade grants
  // after the profile update has actually vacated it.
  freedName: string | null;
};

type AccountNameRow = {
  id: string;
  username: string;
  pendingUsername: string | null;
  updatedAt: string;
};

const MAX_CHAIN_LENGTH = 10;

async function findHolder(
  db: Database,
  username: string,
  excludeId: string,
): Promise<AccountNameRow | null> {
  const rows = await db
    .select({
      id: accounts.id,
      username: accounts.username,
      pendingUsername: accounts.pendingUsername,
      updatedAt: accounts.updatedAt,
    })
    .from(accounts)
    .where(
      and(
        eq(lower(accounts.username), username.toLowerCase()),
        ne(accounts.id, excludeId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

async function findClaimant(
  db: Database,
  username: string,
): Promise<AccountNameRow | null> {
  const rows = await db
    .select({
      id: accounts.id,
      username: accounts.username,
      pendingUsername: accounts.pendingUsername,
      updatedAt: accounts.updatedAt,
    })
    .from(accounts)
    .where(eq(lower(accounts.pendingUsername), username.toLowerCase()))
    .limit(1);

  return rows[0] ?? null;
}

async function applyRename(
  bucket: R2Bucket,
  kv: KVNamespace,
  row: { id: string; oldUsername: string; newUsername: string },
): Promise<void> {
  await Promise.all([
    // A stale diff cache would make this account's next sync believe it still
    // holds its old name and rename the new holder's model files away.
    deleteDiffProfileCache(kv, row.id).catch((error) => {
      console.error(`Failed to delete diff cache for ${row.id}:`, error);
    }),
    renamePlayerModels(bucket, row.oldUsername, row.newUsername).catch(
      (error) => {
        console.error(`Failed to rename player models for ${row.id}:`, error);
      },
    ),
  ]);
}

/**
 * Decides which username the claimant's row should end up with for this sync,
 * moving other rows (unwind/rotation) when that settles pending names.
 *
 * The claimant's own row is NOT written here — the caller applies the returned
 * username/pendingUsername through the regular profile update. During
 * unwind/rotation the claimant's row is renamed in-transaction so the moves
 * are atomic; the profile update then re-writes the same value.
 */
export async function resolveUsername(
  db: Database,
  bucket: R2Bucket,
  kv: KVNamespace,
  input: {
    id: string;
    reportedUsername: string;
    currentUsername: string | null;
  },
): Promise<UsernameResolution> {
  const { id, reportedUsername, currentUsername } = input;

  // Same name (or a capitalization-only change) — nothing contested. Any old
  // pending name is obsolete: pending always mirrors the latest reported name.
  if (
    currentUsername !== null &&
    currentUsername.toLowerCase() === reportedUsername.toLowerCase()
  ) {
    return {
      username: reportedUsername,
      pendingUsername: null,
      freedName: null,
    };
  }

  const holder = await findHolder(db, reportedUsername, id);

  if (!holder) {
    return {
      username: reportedUsername,
      pendingUsername: null,
      freedName: currentUsername,
    };
  }

  // The reported name is taken. Follow the chain of pending names from the
  // holder to see whether the whole chain can be settled right now.
  const chain: AccountNameRow[] = [holder];
  const seenIds = new Set([id, holder.id]);
  let outcome: "park" | "rotate" | "unwind" | "evict" = "park";

  let cursor = holder;
  while (chain.length <= MAX_CHAIN_LENGTH) {
    const wanted = cursor.pendingUsername;
    if (!wanted) {
      if (isStaleHolder(cursor.updatedAt)) {
        outcome = "evict";
      }
      break;
    }

    if (
      currentUsername !== null &&
      wanted.toLowerCase() === currentUsername.toLowerCase()
    ) {
      outcome = "rotate";
      break;
    }

    const nextHolder = await findHolder(db, wanted, cursor.id);
    if (!nextHolder) {
      outcome = "unwind";
      break;
    }

    if (seenIds.has(nextHolder.id)) {
      // A cycle that does not include the claimant — it will settle when one
      // of its own members syncs.
      break;
    }

    seenIds.add(nextHolder.id);
    chain.push(nextHolder);
    cursor = nextHolder;
  }

  if (outcome === "park") {
    console.log({
      event: "username-parked",
      accountId: id,
      wantedUsername: reportedUsername,
      heldBy: holder.id,
    });
    return {
      username: currentUsername ?? placeholderUsername(),
      pendingUsername: reportedUsername,
      freedName: null,
    };
  }

  // Every row in the chain moves to its pending name, and the claimant takes
  // the reported name. Temp-rename first so the unique index never collides
  // mid-move, then assign the final names. An evicted holder simply stays on
  // its placeholder (its clan fields are dropped like any archived row).
  const claimantHasRow = currentUsername !== null;
  const evicted = outcome === "evict" ? chain.pop()! : null;
  const evictedPlaceholder = placeholderUsername();

  const moveChain = db.transaction(async (tx) => {
    if (evicted) {
      const archived = await tx
        .update(accounts)
        .set({
          username: evictedPlaceholder,
          clanName: null,
          clanRank: null,
          clanIcon: null,
          clanTitle: null,
          groupName: null,
        })
        .where(
          and(
            eq(accounts.id, evicted.id),
            eq(accounts.username, evicted.username),
            // Re-check under the transaction: a sync since we looked means the
            // holder is alive after all.
            eq(accounts.updatedAt, evicted.updatedAt),
          ),
        )
        .returning({ id: accounts.id });
      if (archived.length === 0) {
        throw new StaleHolderRevivedError(evicted.id);
      }
    }

    for (const row of chain) {
      await tx
        .update(accounts)
        .set({ username: placeholderUsername() })
        .where(eq(accounts.id, row.id));
    }

    if (claimantHasRow) {
      await tx
        .update(accounts)
        .set({ username: placeholderUsername() })
        .where(eq(accounts.id, id));
    }

    for (const row of chain) {
      await tx
        .update(accounts)
        .set({ username: row.pendingUsername!, pendingUsername: null })
        .where(eq(accounts.id, row.id));
    }

    if (claimantHasRow) {
      await tx
        .update(accounts)
        .set({ username: reportedUsername, pendingUsername: null })
        .where(eq(accounts.id, id));
    }
  });

  try {
    await moveChain;
  } catch (error) {
    if (!(error instanceof StaleHolderRevivedError)) throw error;
    console.log({
      event: "username-parked",
      accountId: id,
      wantedUsername: reportedUsername,
      heldBy: holder.id,
      reason: "stale holder synced concurrently",
    });
    return {
      username: currentUsername ?? placeholderUsername(),
      pendingUsername: reportedUsername,
      freedName: null,
    };
  }

  console.log({
    event:
      outcome === "rotate"
        ? "username-rotation"
        : outcome === "evict"
          ? "username-evict-stale-holder"
          : "username-unwind",
    accountId: id,
    username: reportedUsername,
    moved: chain.map((row) => ({
      accountId: row.id,
      from: row.username,
      to: row.pendingUsername,
    })),
    ...(evicted && {
      evicted: {
        accountId: evicted.id,
        from: evicted.username,
        lastSyncedAt: evicted.updatedAt,
      },
    }),
  });

  // R2/KV bookkeeping for the moved rows. The claimant's own models and cache
  // are handled by the regular profile update that follows.
  await Promise.all([
    ...chain.map((row) =>
      applyRename(bucket, kv, {
        id: row.id,
        oldUsername: row.username,
        newUsername: row.pendingUsername!,
      }),
    ),
    ...(evicted
      ? [
          applyRename(bucket, kv, {
            id: evicted.id,
            oldUsername: evicted.username,
            newUsername: evictedPlaceholder,
          }),
        ]
      : []),
  ]);

  // In a rotation the claimant's old name was consumed by the last chain row;
  // in an unwind or eviction it is now free.
  return {
    username: reportedUsername,
    pendingUsername: null,
    freedName: outcome === "rotate" ? null : currentUsername,
  };
}

/** The holder synced between our read and the archive; treat as "park". */
class StaleHolderRevivedError extends Error {
  constructor(public readonly holderId: string) {
    super("Stale holder synced concurrently");
  }
}

/**
 * Grants a freed name to the row pending on it, then repeats for the name that
 * row moved off of. Called after a profile update has vacated a name.
 */
export async function cascadeFreedName(
  db: Database,
  bucket: R2Bucket,
  kv: KVNamespace,
  freedName: string,
): Promise<void> {
  let name: string | null = freedName;
  let steps = 0;

  while (name && steps < MAX_CHAIN_LENGTH) {
    steps++;

    const claimant = await findClaimant(db, name);
    if (!claimant || !claimant.pendingUsername) {
      return;
    }

    // Confirm the name is actually free before granting it.
    const holder = await findHolder(db, name, claimant.id);
    if (holder) {
      return;
    }

    try {
      await db
        .update(accounts)
        .set({ username: claimant.pendingUsername, pendingUsername: null })
        .where(
          and(
            eq(accounts.id, claimant.id),
            eq(accounts.pendingUsername, claimant.pendingUsername),
          ),
        );
    } catch (error) {
      // A concurrent request claimed the name first; the pending row simply
      // stays parked until the name frees up again.
      console.error(`Failed to grant freed name '${name}':`, error);
      return;
    }

    console.log({
      event: "username-granted",
      accountId: claimant.id,
      from: claimant.username,
      to: claimant.pendingUsername,
    });

    await applyRename(bucket, kv, {
      id: claimant.id,
      oldUsername: claimant.username,
      newUsername: claimant.pendingUsername,
    });

    name = isPlaceholderUsername(claimant.username) ? null : claimant.username;
  }
}

export function isUsernameUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; constraint_name?: string };
  return (
    err.code === "23505" &&
    err.constraint_name === "accounts_username_unique_index"
  );
}
