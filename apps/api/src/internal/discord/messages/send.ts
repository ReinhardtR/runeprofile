import { and, eq, inArray, or } from "drizzle-orm";

import {
  Database,
  discordChannelSettings,
  discordWatches,
  lower,
} from "@runeprofile/db";
import {
  AccountType,
  ActivityEvent,
  type ChannelActivityFilters,
  DEFAULT_CHANNEL_SETTINGS,
  parseDiscordChannelSettings,
} from "@runeprofile/runescape";

import {
  activityAltText,
  renderActivityCardPng,
  renderAvatarDataUri,
} from "~/internal/discord/cards/activity-cards";
import { usesActivityCards } from "~/internal/discord/constants";
import { createDiscordApi } from "~/internal/discord/factory";
import { createActivityEmbed } from "~/internal/discord/messages/activity-embeds";
import {
  MAX_CARDS_PER_MESSAGE,
  postCardsMessage,
} from "~/internal/discord/messages/send-cards";
import { filterActivities } from "~/internal/discord/watch/filter";

export async function sendActivityMessages(params: {
  db: Database;
  discordToken: string;
  discordApplicationId: string;
  activities: ActivityEvent[];
  accountId: string;
  rsn: string;
  accountType?: AccountType;
  clanName: string | null;
  /** Player model store, for the card renderer. */
  bucket: R2Bucket;
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
    bucket,
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

  // Get unique channel IDs and fetch their settings; channels without a
  // settings row (or with an invalid one) use the defaults.
  const channelIds = [...new Set(watches.map((w) => w.channelId))];
  const settingsRows = await db.query.discordChannelSettings.findMany({
    where: inArray(discordChannelSettings.channelId, channelIds),
  });

  const filtersByChannel = new Map<string, ChannelActivityFilters>();
  for (const row of settingsRows) {
    const parsed = parseDiscordChannelSettings(row.settings);
    if (!parsed) {
      console.error(`Invalid channel settings for ${row.channelId}`);
      continue;
    }
    filtersByChannel.set(row.channelId, parsed.filters);
  }

  const discordApi = createDiscordApi(discordToken);

  // Cards are in beta, limited to the clans in the allow list; everyone
  // else keeps the embeds. Rendered once per activity here and reused for
  // every channel, since only which activities pass the filters differs.
  const cards = usesActivityCards(clanName)
    ? await renderCards({ bucket, activities, rsn, accountType })
    : null;

  // Send messages to all watching channels, applying per-channel filters
  await Promise.allSettled(
    channelIds.map(async (channelId) => {
      const channelFilters =
        filtersByChannel.get(channelId) ?? DEFAULT_CHANNEL_SETTINGS.filters;
      const allowedActivities = filterActivities(activities, channelFilters);

      if (allowedActivities.length === 0) return;

      try {
        if (cards) {
          const allowed = allowedActivities
            .map((activity) => cards.get(activity))
            .filter((card): card is NonNullable<typeof card> => card != null);
          for (let i = 0; i < allowed.length; i += MAX_CARDS_PER_MESSAGE) {
            await postCardsMessage({
              token: discordToken,
              channelId,
              cards: allowed.slice(i, i + MAX_CARDS_PER_MESSAGE),
            });
          }
          return;
        }

        const embeds = allowedActivities.map((activity, index) =>
          createActivityEmbed({
            activity,
            discordApplicationId,
            rsn,
            accountType,
            index,
          }),
        );

        // Discord allows max 10 embeds per message
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

/**
 * Renders a card per activity, keyed by the activity it came from.
 *
 * Returns null if rendering fails at all, so a beta clan falls back to the
 * embeds rather than losing the message: a missing model, a bad export or a
 * renderer bug should not cost anyone their activity feed.
 */
async function renderCards(params: {
  bucket: R2Bucket;
  activities: ActivityEvent[];
  rsn: string;
  accountType?: AccountType;
}): Promise<Map<ActivityEvent, { file: Uint8Array; alt: string }> | null> {
  const { bucket, activities, rsn, accountType } = params;
  try {
    // The portrait is the same on every card, so it is rendered once.
    const avatarDataUri = await renderAvatarDataUri(bucket, rsn);
    const cards = new Map<ActivityEvent, { file: Uint8Array; alt: string }>();
    for (const activity of activities) {
      cards.set(activity, {
        file: await renderActivityCardPng({
          activity,
          rsn,
          accountType,
          avatarDataUri,
        }),
        alt: activityAltText(activity, rsn),
      });
    }
    return cards;
  } catch (error) {
    console.error(`Failed to render activity cards for ${rsn}:`, error);
    return null;
  }
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
