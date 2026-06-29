import { and, eq } from "drizzle-orm";

import { Database, discordWatchFilters, discordWatches } from "@runeprofile/db";
import {
  type ActivityEvent,
  type ActivityEventTypeValue,
  DEFAULT_FILTERS,
  getActivityThresholdConfig,
  getActivityTypeLabel,
} from "@runeprofile/runescape";

export { getActivityTypeLabel };

export async function addWatchFilter(params: {
  db: Database;
  channelId: string;
  activityType: ActivityEventTypeValue;
  mode: "allow" | "block";
}) {
  const { db, channelId, activityType, mode } = params;

  await db
    .insert(discordWatchFilters)
    .values({
      id: crypto.randomUUID(),
      channelId,
      activityType,
      mode,
    })
    .onConflictDoUpdate({
      target: [discordWatchFilters.channelId, discordWatchFilters.activityType],
      // Only touch the mode — preserve any existing threshold on the row.
      set: { mode },
    });
}

export async function setWatchThreshold(params: {
  db: Database;
  channelId: string;
  activityType: ActivityEventTypeValue;
  threshold: number;
}) {
  const { db, channelId, activityType, threshold } = params;

  await db
    .insert(discordWatchFilters)
    .values({
      id: crypto.randomUUID(),
      channelId,
      activityType,
      threshold,
    })
    .onConflictDoUpdate({
      target: [discordWatchFilters.channelId, discordWatchFilters.activityType],
      // Only touch the threshold — preserve any existing allow/block mode.
      set: { threshold },
    });
}

export async function removeWatchFilter(params: {
  db: Database;
  channelId: string;
  activityType: ActivityEventTypeValue;
}) {
  const { db, channelId, activityType } = params;

  const result = await db
    .delete(discordWatchFilters)
    .where(
      and(
        eq(discordWatchFilters.channelId, channelId),
        eq(discordWatchFilters.activityType, activityType),
      ),
    )
    .returning({ id: discordWatchFilters.id });

  return result.length > 0;
}

export async function getWatchFilters(params: {
  db: Database;
  channelId: string;
}) {
  const { db, channelId } = params;

  return db.query.discordWatchFilters.findMany({
    where: eq(discordWatchFilters.channelId, channelId),
  });
}

export async function clearWatchFilters(params: {
  db: Database;
  channelId: string;
}) {
  const { db, channelId } = params;

  await db
    .delete(discordWatchFilters)
    .where(eq(discordWatchFilters.channelId, channelId));
}

async function insertDefaultFilters(db: Database, channelId: string) {
  if (DEFAULT_FILTERS.length === 0) return;

  await db
    .insert(discordWatchFilters)
    .values(
      DEFAULT_FILTERS.map((f) => ({
        id: crypto.randomUUID(),
        channelId,
        activityType: f.activityType,
        mode: f.mode ?? null,
        threshold: f.threshold ?? null,
      })),
    )
    .onConflictDoNothing();
}

/**
 * Resets a channel to the default filter set: removes all existing filters and
 * installs `DEFAULT_FILTERS`.
 */
export async function resetWatchFilters(params: {
  db: Database;
  channelId: string;
}) {
  const { db, channelId } = params;

  await db
    .delete(discordWatchFilters)
    .where(eq(discordWatchFilters.channelId, channelId));
  await insertDefaultFilters(db, channelId);
}

/**
 * Seeds `DEFAULT_FILTERS` into a channel when its first watch is added.
 *
 * Call this *after* a successful watch insert. It only seeds when the channel
 * has no existing filters and the just-added watch is its first, so existing
 * channels and customised channels are left untouched.
 */
export async function seedDefaultFiltersIfNew(params: {
  db: Database;
  channelId: string;
}) {
  const { db, channelId } = params;

  const existingFilters = await db.query.discordWatchFilters.findMany({
    where: eq(discordWatchFilters.channelId, channelId),
    columns: { id: true },
    limit: 1,
  });
  if (existingFilters.length > 0) return;

  const watches = await db.query.discordWatches.findMany({
    where: eq(discordWatches.channelId, channelId),
    columns: { id: true },
    limit: 2,
  });
  if (watches.length !== 1) return;

  await insertDefaultFilters(db, channelId);
}

/**
 * Given a channel's activities and filters, returns only the activities that
 * should be sent.
 *
 * Precedence:
 * - allow/block on the activity type (allow wins: only allowed types pass;
 *   else blocked types are dropped; else all types pass)
 * - per-type threshold: an activity is dropped when its extracted value is
 *   below the configured minimum.
 */
export function filterActivities(
  activities: ActivityEvent[],
  filters: {
    activityType: string;
    mode: "allow" | "block" | null;
    threshold: number | null;
  }[],
): ActivityEvent[] {
  if (filters.length === 0) return activities;

  const allowSet = new Set(
    filters.filter((f) => f.mode === "allow").map((f) => f.activityType),
  );
  const blockSet = new Set(
    filters.filter((f) => f.mode === "block").map((f) => f.activityType),
  );
  const thresholdByType = new Map<string, number>();
  for (const f of filters) {
    if (f.threshold !== null) {
      thresholdByType.set(f.activityType, f.threshold);
    }
  }

  return activities.filter((activity) => {
    const type = activity.type;

    if (allowSet.size > 0) {
      if (!allowSet.has(type)) return false;
    } else if (blockSet.size > 0) {
      if (blockSet.has(type)) return false;
    }

    const threshold = thresholdByType.get(type);
    if (threshold !== undefined) {
      const config = getActivityThresholdConfig(type as ActivityEventTypeValue);
      if (config && config.getValue(activity) < threshold) return false;
    }

    return true;
  });
}
