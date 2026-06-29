import { and, eq } from "drizzle-orm";

import { Database, discordWatchFilters } from "@runeprofile/db";
import {
  ActivityEventType,
  type ActivityEventTypeValue,
} from "@runeprofile/runescape";

const ACTIVITY_TYPE_LABELS: Record<ActivityEventTypeValue, string> = {
  [ActivityEventType.LEVEL_UP]: "Level Up",
  [ActivityEventType.NEW_ITEM_OBTAINED]: "New Item Obtained",
  [ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED]: "Achievement Diary",
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED]: "Combat Achievement",
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_REACHED]: "Combat Achievement Tier Reached",
  [ActivityEventType.QUEST_COMPLETED]: "Quest Completed",
  [ActivityEventType.MAXED]: "Maxed",
  [ActivityEventType.XP_MILESTONE]: "XP Milestone",
  [ActivityEventType.VALUABLE_DROP]: "Valuable Drop",
};

export function getActivityTypeLabel(type: ActivityEventTypeValue): string {
  return ACTIVITY_TYPE_LABELS[type] ?? type;
}

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
      set: { mode },
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

/**
 * Given a set of activities and the channel's filters, returns only the
 * activity types that should be sent.
 *
 * Precedence:
 * - If any `allow` entries exist → only those types pass
 * - Else if any `block` entries exist → everything except blocked types passes
 * - No filters → everything passes
 */
export function filterActivityTypes(
  activityTypes: ActivityEventTypeValue[],
  filters: { activityType: string; mode: string }[],
): ActivityEventTypeValue[] {
  if (filters.length === 0) return activityTypes;

  const allowSet = new Set(
    filters.filter((f) => f.mode === "allow").map((f) => f.activityType),
  );
  const blockSet = new Set(
    filters.filter((f) => f.mode === "block").map((f) => f.activityType),
  );

  if (allowSet.size > 0) {
    return activityTypes.filter((type) => allowSet.has(type));
  }

  if (blockSet.size > 0) {
    return activityTypes.filter((type) => !blockSet.has(type));
  }

  return activityTypes;
}
