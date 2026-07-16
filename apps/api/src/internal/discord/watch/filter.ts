import { eq, sql } from "drizzle-orm";

import { Database, discordChannelSettings } from "@runeprofile/db";
import {
  type ActivityEvent,
  type ActivityEventTypeValue,
  type ChannelActivityFilters,
  DEFAULT_CHANNEL_SETTINGS,
  type DiscordChannelSettings,
  DiscordChannelSettingsSchema,
  getActivityThresholdConfig,
  getActivityTypeLabel,
} from "@runeprofile/runescape";

export { getActivityTypeLabel };

// ---------------------------------------------------------------------------
// Settings storage
// ---------------------------------------------------------------------------

/**
 * Loads a channel's settings document. A missing or invalid row yields the
 * default settings (`isDefault: true`), so callers can mutate a copy and save
 * it back without special-casing new channels.
 */
export async function getChannelSettings(params: {
  db: Database;
  channelId: string;
}): Promise<{ settings: DiscordChannelSettings; isDefault: boolean }> {
  const { db, channelId } = params;

  const row = await db.query.discordChannelSettings.findFirst({
    where: eq(discordChannelSettings.channelId, channelId),
  });
  if (!row) {
    return { settings: structuredClone(DEFAULT_CHANNEL_SETTINGS), isDefault: true };
  }

  const parsed = DiscordChannelSettingsSchema.safeParse(row.settings);
  if (!parsed.success) {
    console.error(
      `Invalid channel settings for ${channelId}, falling back to defaults:`,
      parsed.error,
    );
    return { settings: structuredClone(DEFAULT_CHANNEL_SETTINGS), isDefault: true };
  }

  return { settings: parsed.data, isDefault: false };
}

export async function saveChannelSettings(params: {
  db: Database;
  channelId: string;
  settings: DiscordChannelSettings;
}) {
  const { db, channelId, settings } = params;

  await db
    .insert(discordChannelSettings)
    .values({ channelId, settings })
    .onConflictDoUpdate({
      target: discordChannelSettings.channelId,
      set: { settings, updatedAt: sql`now()` },
    });
}

/** Deletes the settings row — the channel falls back to the defaults. */
export async function resetChannelSettings(params: {
  db: Database;
  channelId: string;
}) {
  const { db, channelId } = params;

  await db
    .delete(discordChannelSettings)
    .where(eq(discordChannelSettings.channelId, channelId));
}

// ---------------------------------------------------------------------------
// Pure settings mutations (each returns a new document, never mutates input)
// ---------------------------------------------------------------------------

export type SettingsMutation = {
  settings: DiscordChannelSettings;
  /** Extra context for the reply, e.g. when the mode implicitly switched. */
  notice?: string;
};

/**
 * Adds an activity type to the channel's list, switching the mode when needed.
 *
 * Allow and block lists are mutually exclusive: adding an allow filter to a
 * blocklist channel switches it to an allowlist (discarding the blocked
 * types) and vice versa — the returned notice explains what happened.
 */
export function applyListFilter(
  current: DiscordChannelSettings,
  activityType: ActivityEventTypeValue,
  mode: "allowlist" | "blocklist",
): SettingsMutation {
  const settings = structuredClone(current);
  const filters = settings.filters;
  let notice: string | undefined;

  if (filters.mode !== mode) {
    if (filters.types.length > 0) {
      const kind = filters.mode === "allowlist" ? "allow" : "block";
      notice = `This channel now uses ${mode === "allowlist" ? "an allow list" : "a block list"} — removed ${filters.types.length} ${kind} filter${filters.types.length === 1 ? "" : "s"}.`;
    }
    filters.mode = mode;
    filters.types = [];
  }

  if (!filters.types.includes(activityType)) {
    filters.types.push(activityType);
  }

  return { settings, notice };
}

/** Sets the minimum threshold for an activity type. */
export function applyThreshold(
  current: DiscordChannelSettings,
  activityType: ActivityEventTypeValue,
  threshold: number,
): SettingsMutation {
  const settings = structuredClone(current);
  settings.filters.thresholds[activityType] = threshold;
  return { settings, notice: undefined };
}

export type RemoveFilterKind = "all" | "list" | "threshold";

/**
 * Removes an activity type's filters. `kind` selects what to remove: its
 * allow/block list entry, its threshold, or both (`all`).
 *
 * When the last entry of an allow list is removed the mode switches back to
 * an (empty) block list, so the channel receives everything again instead of
 * silently receiving nothing.
 */
export function removeFilter(
  current: DiscordChannelSettings,
  activityType: ActivityEventTypeValue,
  kind: RemoveFilterKind,
): SettingsMutation & { removed: boolean } {
  const settings = structuredClone(current);
  const filters = settings.filters;
  let removed = false;
  let notice: string | undefined;

  if (kind === "all" || kind === "list") {
    const index = filters.types.indexOf(activityType);
    if (index !== -1) {
      filters.types.splice(index, 1);
      removed = true;

      if (filters.mode === "allowlist" && filters.types.length === 0) {
        filters.mode = "blocklist";
        notice =
          "No allowed activity types left — this channel now receives every type again.";
      }
    }
  }

  if (kind === "all" || kind === "threshold") {
    if (filters.thresholds[activityType] !== undefined) {
      delete filters.thresholds[activityType];
      removed = true;
    }
  }

  return { settings, removed, notice };
}

// ---------------------------------------------------------------------------
// Filtering engine
// ---------------------------------------------------------------------------

/**
 * Returns only the activities a channel should receive.
 *
 * - `allowlist` mode: only listed types pass; `blocklist` mode: listed types
 *   are dropped.
 * - Thresholds: an activity is dropped when its extracted value is below the
 *   configured minimum for its type.
 */
export function filterActivities(
  activities: ActivityEvent[],
  filters: ChannelActivityFilters,
): ActivityEvent[] {
  const types = new Set(filters.types);

  return activities.filter((activity) => {
    const type = activity.type;

    if (filters.mode === "allowlist" ? !types.has(type) : types.has(type)) {
      return false;
    }

    const threshold = filters.thresholds[type];
    if (threshold !== undefined) {
      const config = getActivityThresholdConfig(type);
      if (config && config.getValue(activity) < threshold) return false;
    }

    return true;
  });
}
