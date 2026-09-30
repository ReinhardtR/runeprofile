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
  DiscordMessageError,
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

  // Cards are in beta, limited to the clans in the allow list; everyone
  // else keeps the embeds.
  const useCards = usesActivityCards(clanName);

  // A card costs real CPU to draw and this runs inside the request that
  // triggered it. Nothing caps how many events one sync can produce, and a
  // player returning after months is a backlog, not a set of moments worth
  // a card each - so a huge batch is dropped rather than posted.
  if (useCards && activities.length > MAX_CARD_BATCH) {
    console.log({
      event: "discord_activity_messages_skipped",
      reason: "too_many_activities",
      activity_count: activities.length,
    });
    return;
  }

  // Find channels watching this player or clan
  const condition = getWatchCondition({ accountId, clanName });
  if (!condition) {
    return;
  }

  const watches = await db.query.discordWatches.findMany({
    where: condition,
  });
  if (watches.length === 0) {
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
  const startedAt = Date.now();
  let messagesSent = 0;
  let channelsFailed = 0;

  const cards = useCards
    ? createCardRenderer({ bucket, activities, rsn, accountType })
    : null;

  const postEmbeds = async (
    channelId: string,
    batch: ActivityEvent[],
    offset: number,
  ) => {
    const embeds = batch.map((activity, i) =>
      createActivityEmbed({
        activity,
        discordApplicationId,
        rsn,
        accountType,
        index: offset + i,
      }),
    );
    const response = await discordApi(
      "POST",
      "/channels/{channel.id}/messages",
      [channelId],
      { embeds },
    );
    if (!response.ok) throw await DiscordMessageError.from(response);
  };

  // Send messages to all watching channels, applying per-channel filters
  await Promise.allSettled(
    channelIds.map(async (channelId) => {
      const channelFilters =
        filtersByChannel.get(channelId) ?? DEFAULT_CHANNEL_SETTINGS.filters;
      const allowedActivities = filterActivities(activities, channelFilters);

      if (allowedActivities.length === 0) return;

      try {
        // One message's worth at a time, and each message's cards drawn
        // only once the one before it is out. Drawing a whole batch up
        // front ran the Worker out of memory on 15 cards: the isolate is
        // killed outright, so nothing was posted and nothing was logged.
        // Both cards and embeds cap out at ten per message.
        for (let i = 0; i < allowedActivities.length; i += PER_MESSAGE) {
          const batch = allowedActivities.slice(i, i + PER_MESSAGE);

          if (cards) {
            const rendered = (await Promise.all(batch.map(cards))).filter(
              (card): card is Card => card != null,
            );
            if (rendered.length > 0) {
              await postCardsMessage({
                token: discordToken,
                channelId,
                cards: rendered,
              });
              messagesSent++;
              continue;
            }
            // Every card in the message failing means the renderer is
            // broken rather than one model being odd, so fall back to the
            // embeds for it rather than posting nothing.
          }

          await postEmbeds(channelId, batch, i);
          messagesSent++;
        }
      } catch (error) {
        channelsFailed++;
        console.error({
          event: "discord_activity_message_failed",
          channel_id: channelId,
          format: cards ? "cards" : "embeds",
          rsn,
          ...describeError(error),
        });
      }
    }),
  );

  console.log({
    event: "discord_activity_messages_sent",
    format: cards ? "cards" : "embeds",
    channel_count: channelIds.length,
    channels_failed: channelsFailed,
    activity_count: activities.length,
    messages_sent: messagesSent,
    ...cards?.stats(),
    duration_ms: Date.now() - startedAt,
  });
}

/** Discord takes at most ten embeds, or ten attachments, per message. */
const PER_MESSAGE = MAX_CARDS_PER_MESSAGE;

/**
 * An error as log fields. Handing an Error itself to console.error keeps
 * only its stack in Workers Logs, which dropped the message and with it
 * the one line that said why Discord refused a post.
 */
function describeError(error: unknown): Record<string, unknown> {
  if (error instanceof DiscordMessageError) {
    return {
      error_name: error.name,
      discord_status: error.status,
      discord_code: error.code,
      discord_body: error.body,
    };
  }
  if (error instanceof Error) {
    return {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
    };
  }
  return { error_message: String(error) };
}

/**
 * Above this many activities in one batch, a card player's batch is not
 * posted at all. Roomy enough for an ordinary sync - a level up in every skill plus a few
 * drops - while keeping the render inside the Worker's CPU budget.
 */
const MAX_CARD_BATCH = 50;

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
 * Cards are drawn one at a time, however many channels are asking. Each
 * render holds a full satori tree and resvg canvas, and wasm memory only
 * ever grows to the peak - drawing a batch at once is what ran the Worker
 * out of memory.
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
}): ((activity: ActivityEvent) => Promise<Card | null>) & {
  stats: () => Record<string, number>;
} {
  const { bucket, rsn, accountType } = params;
  let portrait: Promise<string> | null = null;
  const cards = new Map<ActivityEvent, Promise<Card | null>>();
  let queue: Promise<unknown> = Promise.resolve();
  let rendered = 0;
  let failed = 0;
  let renderMs = 0;

  const render = async (activity: ActivityEvent): Promise<Card> => {
    const startedAt = Date.now();
    try {
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
    } finally {
      renderMs += Date.now() - startedAt;
    }
  };

  const renderer = (activity: ActivityEvent) => {
    let card = cards.get(activity);
    if (!card) {
      const next = queue.then(() => render(activity));
      queue = next.catch(() => {});
      card = next.then(
        (result) => {
          rendered++;
          return result;
        },
        (error: unknown) => {
          failed++;
          console.error({
            event: "discord_activity_card_render_failed",
            rsn,
            activity_type: activity.type,
            ...describeError(error),
          });
          return null;
        },
      );
      cards.set(activity, card);
    }
    return card;
  };

  return Object.assign(renderer, {
    stats: () => ({
      cards_rendered: rendered,
      cards_failed: failed,
      render_ms: renderMs,
    }),
  });
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
