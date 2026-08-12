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
  // else keeps the embeds.
  //
  // A card costs real CPU to draw and this runs inside the request that
  // triggered it, so a big batch goes out as embeds instead. Nothing caps
  // how many events one sync can produce - level ups alone can be one per
  // skill - and a player returning after months is a backlog to summarise,
  // not a set of moments worth a card each.
  const cards =
    usesActivityCards(clanName) && activities.length <= MAX_CARD_BATCH
      ? createCardRenderer({ bucket, activities, rsn, accountType })
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
          const rendered = await Promise.all(allowedActivities.map(cards));
          const allowed = rendered.filter(
            (card): card is NonNullable<typeof card> => card != null,
          );
          // Every card failing means the renderer is broken rather than one
          // model being odd, so fall through to the embeds.
          if (allowed.length === 0 && allowedActivities.length > 0) {
            throw new Error("no activity cards could be rendered");
          }
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
 * Above this many activities in one batch, cards are skipped for embeds.
 * Ten is also what fits in a single Discord message.
 */
const MAX_CARD_BATCH = MAX_CARDS_PER_MESSAGE;

type Card = { file: Uint8Array; alt: string };

/**
 * Makes a card renderer for one player's batch of activities.
 *
 * Renders lazily and memoises, so an activity every channel filters out is
 * never drawn, and one that several channels want is drawn once. The
 * player's portrait is shared by all of them. Promises are cached rather
 * than results, because channels are served concurrently and would
 * otherwise each start the same render.
 *
 * A card that fails resolves to null and that activity falls out of the
 * message: a missing model or a bad export should cost a nicer image, not
 * the player's activity feed.
 */
function createCardRenderer(params: {
  bucket: R2Bucket;
  activities: ActivityEvent[];
  rsn: string;
  accountType?: AccountType;
}): (activity: ActivityEvent) => Promise<Card | null> {
  const { bucket, rsn, accountType } = params;
  let portrait: Promise<string> | null = null;
  const cards = new Map<ActivityEvent, Promise<Card | null>>();

  return (activity) => {
    let card = cards.get(activity);
    if (!card) {
      card = (async () => {
        portrait ??= renderAvatarDataUri(bucket, rsn);
        return {
          file: await renderActivityCardPng({
            activity,
            rsn,
            accountType,
            avatarDataUri: await portrait,
          }),
          alt: activityAltText(activity, rsn),
        };
      })().catch((error: unknown) => {
        console.error(`Failed to render an activity card for ${rsn}:`, error);
        return null;
      });
      cards.set(activity, card);
    }
    return card;
  };
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
