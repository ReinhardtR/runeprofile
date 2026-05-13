import { and, eq, inArray, or } from "drizzle-orm";

import {
  Database,
  discordWatchFilters,
  discordWatches,
  lower,
} from "@runeprofile/db";
import {
  AccountType,
  ActivityEvent,
  type ActivityEventTypeValue,
} from "@runeprofile/runescape";

import { createDiscordApi } from "~/internal/discord/factory";
import { createActivityEmbed } from "~/internal/discord/messages/activity-embeds";
import { filterActivityTypes } from "~/internal/discord/watch/filter";

export async function sendActivityMessages(params: {
  db: Database;
  discordToken: string;
  discordApplicationId: string;
  activities: ActivityEvent[];
  accountId: string;
  rsn: string;
  accountType?: AccountType;
  clanName: string | null;
}) {
  const {
    db,
    discordToken,
    discordApplicationId,
    accountId,
    clanName,
    activities,
    rsn,
    accountType,
  } = params;

  if (activities.length === 0) return;

  // Find channels watching this player or clan
  const condition = getWatchCondition({ accountId, clanName });
  if (!condition) {
    console.log("No watch condition found");
    return;
  }

  const watches = await db.query.discordWatches.findMany({
    where: condition,
  });
  if (watches.length === 0) {
    console.log("No watches found for this activity");
    return;
  }

  // Get unique channel IDs and fetch their filters
  const channelIds = [...new Set(watches.map((w) => w.channelId))];
  const allFilters =
    channelIds.length > 0
      ? await db.query.discordWatchFilters.findMany({
          where: inArray(discordWatchFilters.channelId, channelIds),
        })
      : [];

  // Group filters by channel
  const filtersByChannel = new Map<
    string,
    { activityType: string; mode: string }[]
  >();
  for (const filter of allFilters) {
    const existing = filtersByChannel.get(filter.channelId) ?? [];
    existing.push(filter);
    filtersByChannel.set(filter.channelId, existing);
  }

  const discordApi = createDiscordApi(discordToken);
  const activityTypes = activities.map(
    (a) => a.type,
  ) as ActivityEventTypeValue[];

  // Send messages to all watching channels, applying per-channel filters
  await Promise.allSettled(
    channelIds.map(async (channelId) => {
      const channelFilters = filtersByChannel.get(channelId) ?? [];
      const allowedTypes = filterActivityTypes(activityTypes, channelFilters);

      if (allowedTypes.length === 0) return;

      const embeds = activities
        .filter((a) => allowedTypes.includes(a.type as ActivityEventTypeValue))
        .map((activity) =>
          createActivityEmbed({
            activity,
            discordApplicationId,
            rsn,
            accountType,
          }),
        );

      if (embeds.length === 0) return;

      // Discord allows max 10 embeds per message
      try {
        for (let i = 0; i < embeds.length; i += 10) {
          await discordApi(
            "POST",
            "/channels/{channel.id}/messages",
            [channelId],
            { embeds: embeds.slice(i, i + 10) },
          );
        }
      } catch (error) {
        console.error(`Failed to send message to channel ${channelId}:`, error);
      }
    }),
  );

  console.log(`Sent activity messages to ${channelIds.length} channels`);
}

function getWatchCondition(params: {
  accountId?: string;
  clanName: string | null;
}) {
  const { accountId, clanName } = params;
  const conditions = [];

  if (accountId) {
    conditions.push(
      and(
        eq(discordWatches.targetType, "player"),
        eq(discordWatches.targetId, accountId),
      ),
    );
  }

  if (clanName) {
    conditions.push(
      and(
        eq(discordWatches.targetType, "clan"),
        eq(lower(discordWatches.targetId), clanName.toLowerCase()),
      ),
    );
  }

  if (conditions.length === 0) {
    return null;
  }

  return or(...conditions);
}
