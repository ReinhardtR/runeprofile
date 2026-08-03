import { eq } from "drizzle-orm";

import { Database, accounts } from "@runeprofile/db";
import {
  ACHIEVEMENT_DIARIES,
  COLLECTION_LOG_ITEM_IDS,
  COMBAT_ACHIEVEMENT_TIERS,
  QUESTS,
  SKILLS,
} from "@runeprofile/runescape";

import {
  DiffProfile,
  getDiffProfileFromCache,
  setDiffProfileCache,
} from "~/lib/profiles/diff-cache";

export type UpdateProfileInput = {
  id: string;
  username: string;
  accountType: number;
  clan?: {
    name: string;
    rank: number;
    icon: number;
    title: string;
  };
  eventSource?: string;
  groupName?: string;
  achievementDiaryTiers: Array<{
    areaId: number;
    tierIndex: number;
    completedCount: number;
  }>;
  // id -> completedCount (legacy, from old plugin clients)
  combatAchievementTiers?: Record<number, number>;
  // varp id -> raw 32-bit value (new plugin clients)
  combatAchievementVarps?: Record<number, number>;
  // id -> quantity
  items: Record<number, number>;
  // id -> quantity obtained since the last sync, reported by the in-game loot
  // feed. Applied on top of the stored quantity instead of replacing it.
  itemDeltas?: Record<number, number>;
  // id -> state
  quests: Record<number, number>;
  // name -> xp
  skills: Record<string, number>;
};

export type ProfileUpdates = {
  id: string;
  currentProfile: DiffProfile | null;
  forceResync: boolean;
  // True when force resync was applied to items (requires a full clog payload).
  // The forceResync flag is only consumed once this happens.
  itemsForceResynced: boolean;
  username: string;
  pendingUsername: string | null;
  accountType: number;
  clan?: {
    name: string;
    rank: number;
    icon: number;
    title: string;
  };
  groupName?: string;
  achievementDiaryTiers: Array<{
    areaId: number;
    tier: number;
    completedCount: number;
    oldCompletedCount: number;
  }>;
  combatAchievementTiers: Array<{
    id: number;
    completedCount: number;
    oldCompletedCount: number;
  }>;
  combatAchievementVarps: {
    newVarps: Record<string, number> | null;
    oldVarps: Record<string, number> | null;
  };
  items: Array<{
    id: number;
    quantity: number;
    oldQuantity: number;
  }>;
  // Increments applied to already-obtained items, kept separate from `items`
  // because the resulting quantity is only known once the row is updated.
  itemDeltas: Array<{
    id: number;
    delta: number;
  }>;
  quests: Array<{
    id: number;
    state: number;
    oldState: number;
  }>;
  skills: Array<{
    name: string;
    xp: number;
    oldXp: number;
  }>;
};

/**
 * Minimum number of non-zero items required for a payload to be treated as a
 * full collection log transmit. The plugin only knows the complete log after
 * the player opens it in-game; autosync batches carry few or no items, so
 * absence from a small payload means nothing.
 */
export const MINIMUM_FULL_UPDATE_ITEMS = 20;

/**
 * Largest increase a single sync may apply to one item. A well behaved client
 * reports a handful per sync; anything beyond this is a bug or a replay.
 */
export const MAX_ITEM_DELTA = 1000;

const COLLECTION_LOG_ITEM_ID_SET = new Set(COLLECTION_LOG_ITEM_IDS);

export function isFullItemPayload(
  items: UpdateProfileInput["items"],
): boolean {
  let count = 0;
  for (const quantity of Object.values(items)) {
    if (quantity > 0) count++;
  }
  return count >= MINIMUM_FULL_UPDATE_ITEMS;
}

async function getProfileForDiff(
  db: Database,
  id: string,
): Promise<{ diffProfile: DiffProfile; forceResync: boolean } | null> {
  const result = await db.query.accounts.findFirst({
    where: (fields, { eq }) => eq(fields.id, id),
    columns: { username: true, updatedAt: true, forceResync: true },
    with: {
      achievementDiaryTiers: {
        columns: { areaId: true, tier: true, completedCount: true },
      },
      combatAchievementTiers: {
        columns: { id: true, completedCount: true },
      },
      combatAchievementVarps: {
        columns: { varps: true },
      },
      items: { columns: { id: true, quantity: true } },
      quests: { columns: { id: true, state: true } },
      skills: { columns: { name: true, xp: true } },
    },
  });

  if (!result) return null;

  return {
    diffProfile: {
      username: result.username,
      updatedAt: result.updatedAt,
      achievementDiaryTiers: result.achievementDiaryTiers.map((t) => ({
        areaId: t.areaId,
        tierIndex: t.tier,
        completedCount: t.completedCount,
      })),
      combatAchievementTiers: result.combatAchievementTiers,
      combatAchievementVarps: result.combatAchievementVarps?.varps ?? null,
      items: result.items,
      quests: result.quests,
      skills: result.skills,
    },
    forceResync: result.forceResync,
  };
}

export async function getProfileUpdates(
  db: Database,
  kv: KVNamespace,
  input: UpdateProfileInput,
): Promise<ProfileUpdates> {
  // Try KV cache first, fall back to lightweight DB query
  let diffProfile: DiffProfile | null = null;
  let forceResync = false;

  try {
    diffProfile = await getDiffProfileFromCache(kv, input.id);
    console.log(
      `Cache ${diffProfile ? "hit" : "miss"} for profile diff with ID: ${input.id}`,
    );
  } catch {
    // KV read failed, fall through to DB
    console.log(`Failed to read diff profile from cache for ID: ${input.id}`);
  }

  if (diffProfile) {
    // Validate cache against DB timestamp and check forceResync flag
    try {
      const row = await db
        .select({
          updatedAt: accounts.updatedAt,
          forceResync: accounts.forceResync,
        })
        .from(accounts)
        .where(eq(accounts.id, input.id))
        .limit(1);

      const dbRow = row[0];
      forceResync = dbRow?.forceResync ?? false;

      if (!dbRow?.updatedAt || dbRow.updatedAt !== diffProfile.updatedAt) {
        // Cache is inconsistent with DB — discard and fetch fresh
        console.log(
          `Cache invalid for ID: ${input.id}. DB updatedAt: ${dbRow?.updatedAt}, Cache updatedAt: ${diffProfile.updatedAt}`,
        );
        diffProfile = null;
      }
    } catch {
      // Timestamp check failed, discard cache to be safe
      diffProfile = null;
    }
  }

  if (!diffProfile) {
    const result = await getProfileForDiff(db, input.id);

    if (result) {
      diffProfile = result.diffProfile;
      forceResync = result.forceResync;

      try {
        await setDiffProfileCache(kv, input.id, diffProfile);
      } catch {
        // Non-critical: cache will be populated after successful update
        console.log(`Failed to set diff profile cache for ID: ${input.id}`);
      }
    }
  }

  // Items can only be force resynced against a full clog payload — deleting
  // stored items missing from a partial autosync batch would wipe the log.
  const fullItemPayload = isFullItemPayload(input.items);
  const itemsForceResynced = forceResync && fullItemPayload;

  if (forceResync) {
    console.log(
      `Force resync enabled for account ID: ${input.id} (items: ${itemsForceResynced})`,
    );
  }

  return {
    id: input.id,
    forceResync,
    itemsForceResynced,
    username: input.username,
    pendingUsername: null,
    accountType: input.accountType,
    clan: input.clan,
    groupName: input.groupName,
    achievementDiaryTiers: getAchievementDiaryTierUpdates({
      newData: input.achievementDiaryTiers,
      oldData: diffProfile?.achievementDiaryTiers || [],
      forceResync,
    }),
    combatAchievementTiers: getCombatAchievementTierUpdates({
      newData: input.combatAchievementTiers ?? {},
      oldData: diffProfile?.combatAchievementTiers || [],
      forceResync,
    }),
    combatAchievementVarps: {
      newVarps:
        input.combatAchievementVarps &&
        Object.keys(input.combatAchievementVarps).length > 0
          ? Object.fromEntries(
              Object.entries(input.combatAchievementVarps).map(([k, v]) => [
                String(k),
                v,
              ]),
            )
          : null,
      oldVarps:
        diffProfile?.combatAchievementVarps &&
        Object.keys(diffProfile.combatAchievementVarps).length > 0
          ? diffProfile.combatAchievementVarps
          : null,
    },
    items: getItemUpdates({
      newData: input.items,
      oldData: diffProfile?.items || [],
      forceResync: itemsForceResynced,
      isFullPayload: fullItemPayload,
    }),
    itemDeltas: getItemDeltaUpdates({
      newDeltas: input.itemDeltas,
      items: input.items,
      forceResync,
    }),
    quests: getQuestUpdates({
      newData: input.quests,
      oldData: diffProfile?.quests || [],
      forceResync,
    }),
    skills: getSkillUpdates({
      newData: input.skills,
      oldData: diffProfile?.skills || [],
      forceResync,
    }),
    currentProfile: diffProfile,
  };
}

export function getAchievementDiaryTierUpdates({
  newData,
  oldData,
  forceResync,
}: {
  newData: UpdateProfileInput["achievementDiaryTiers"];
  oldData: DiffProfile["achievementDiaryTiers"];
  forceResync?: boolean;
}): ProfileUpdates["achievementDiaryTiers"] {
  const updates: ProfileUpdates["achievementDiaryTiers"] = [];

  for (const diary of ACHIEVEMENT_DIARIES) {
    for (const [tierIndex] of diary.tiers.entries()) {
      const newTier = newData.find(
        (t) => t.areaId === diary.id && t.tierIndex === tierIndex,
      );
      if (!newTier) continue;

      const oldTier = oldData.find(
        (t) => t.areaId === diary.id && t.tierIndex === tierIndex,
      );
      if (newTier.completedCount === 0 && !(forceResync && oldTier)) continue;
      if (oldTier && oldTier.completedCount === newTier.completedCount) {
        continue;
      }
      if (
        oldTier &&
        oldTier.completedCount > newTier.completedCount &&
        !forceResync
      ) {
        continue;
      }

      updates.push({
        areaId: diary.id,
        tier: tierIndex,
        completedCount: newTier.completedCount,
        oldCompletedCount: oldTier?.completedCount || 0,
      });
    }
  }

  return updates;
}

export function getCombatAchievementTierUpdates({
  newData,
  oldData,
  forceResync,
}: {
  newData: UpdateProfileInput["combatAchievementTiers"];
  oldData: DiffProfile["combatAchievementTiers"];
  forceResync?: boolean;
}): ProfileUpdates["combatAchievementTiers"] {
  const updates: ProfileUpdates["combatAchievementTiers"] = [];
  if (!newData) return updates;

  for (const tier of COMBAT_ACHIEVEMENT_TIERS) {
    const newCompletedCount = newData[tier.id];
    if (newCompletedCount === undefined) {
      continue;
    }

    const oldTier = oldData.find((t) => t.id === tier.id);
    if (newCompletedCount === 0 && !(forceResync && oldTier)) {
      continue;
    }
    if (oldTier && oldTier.completedCount === newCompletedCount) {
      continue;
    }
    if (oldTier && oldTier.completedCount > newCompletedCount && !forceResync) {
      continue;
    }

    updates.push({
      id: tier.id,
      completedCount: newCompletedCount,
      oldCompletedCount: oldTier?.completedCount || 0,
    });
  }

  return updates;
}

export function getItemUpdates({
  newData,
  oldData,
  forceResync,
  isFullPayload,
}: {
  newData: UpdateProfileInput["items"];
  oldData: DiffProfile["items"];
  forceResync?: boolean;
  /** True when the payload is a complete clog transmit (see isFullItemPayload). */
  isFullPayload?: boolean;
}): ProfileUpdates["items"] {
  const updates: ProfileUpdates["items"] = [];

  for (const itemId of COLLECTION_LOG_ITEM_IDS) {
    const newQuantity = newData[itemId] ?? 0;
    // Absence only means "not obtained" during a force resync, where the
    // caller has verified the payload is a full clog transmit. A quantity of
    // zero then emits a deletion for the stored item.
    if (newQuantity === 0 && !forceResync) {
      continue;
    }

    const oldItem = oldData.find((item) => item.id === itemId);
    if (newQuantity === 0 && !oldItem) {
      continue;
    }
    if (oldItem && oldItem.quantity === newQuantity) {
      continue;
    }
    // Only a complete clog transmit is authoritative enough to lower a count.
    // A partial autosync reporting a stale quantity would otherwise undo the
    // increases applied from the loot feed.
    if (
      oldItem &&
      oldItem.quantity > newQuantity &&
      !forceResync &&
      !isFullPayload
    ) {
      continue;
    }

    updates.push({
      id: itemId,
      quantity: newQuantity,
      oldQuantity: oldItem?.quantity || 0,
    });
  }

  return updates;
}

/**
 * Turns reported quantity increases into updates for items the profile already
 * knows were obtained.
 *
 * The loot feed proves an item was looted, not that the collection log credited
 * it, so deltas are never allowed to create a row — first obtains stay the job
 * of the in-game collection log notification. Being wrong is therefore limited
 * to an inflated count on an already obtained item, which the next full clog
 * transmit corrects.
 */
export function getItemDeltaUpdates({
  newDeltas,
  items,
  forceResync,
}: {
  newDeltas: UpdateProfileInput["itemDeltas"];
  items: UpdateProfileInput["items"];
  forceResync?: boolean;
}): ProfileUpdates["itemDeltas"] {
  // A force resync replaces quantities outright, so deltas would fight it
  if (!newDeltas || forceResync) {
    return [];
  }

  const updates: ProfileUpdates["itemDeltas"] = [];

  for (const [rawId, rawDelta] of Object.entries(newDeltas)) {
    const id = Number(rawId);
    if (!COLLECTION_LOG_ITEM_ID_SET.has(id)) {
      continue;
    }
    // The payload's own quantity comes from the collection log itself, so it
    // wins over anything inferred from loot. A well behaved client resolves this
    // before sending and never puts an item in both, so this is a safety net.
    if (items[id] !== undefined) {
      console.log(`Ignoring delta for item ${id}, payload carries a quantity`);
      continue;
    }

    const delta = Math.floor(rawDelta);
    if (!Number.isFinite(delta) || delta < 1) {
      continue;
    }

    updates.push({ id, delta: Math.min(delta, MAX_ITEM_DELTA) });
  }

  return updates;
}

export function getQuestUpdates({
  newData,
  oldData,
  forceResync,
}: {
  newData: UpdateProfileInput["quests"];
  oldData: DiffProfile["quests"];
  forceResync?: boolean;
}): ProfileUpdates["quests"] {
  const updates: ProfileUpdates["quests"] = [];

  for (const quest of QUESTS) {
    const newState = newData[quest.id];
    if (newState === undefined) {
      continue;
    }

    const oldQuest = oldData.find((q) => q.id === quest.id);
    if (newState === 0 && !(forceResync && oldQuest)) {
      continue;
    }
    if (oldQuest && oldQuest.state === newState) {
      continue;
    }
    if (oldQuest && oldQuest.state > newState && !forceResync) {
      continue;
    }

    updates.push({
      id: quest.id,
      state: newState,
      oldState: oldQuest?.state || 0,
    });
  }

  return updates;
}

export function getSkillUpdates({
  newData,
  oldData,
  forceResync,
}: {
  newData: UpdateProfileInput["skills"];
  oldData: DiffProfile["skills"];
  forceResync?: boolean;
}): ProfileUpdates["skills"] {
  const updates: ProfileUpdates["skills"] = [];

  for (const skillName of SKILLS) {
    const newXp = newData[skillName];
    if (newXp === undefined) {
      continue;
    }

    const oldSkill = oldData.find((skill) => skill.name === skillName);
    if (newXp === 0 && !(forceResync && oldSkill)) {
      continue;
    }
    if (oldSkill && oldSkill.xp >= newXp && !forceResync) {
      continue;
    }
    if (oldSkill && oldSkill.xp === newXp) {
      continue;
    }

    updates.push({
      name: skillName,
      xp: newXp,
      oldXp: oldSkill?.xp || 0,
    });
  }

  return updates;
}
