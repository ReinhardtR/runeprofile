import { Embed } from "discord-hono";
import { and, eq, or } from "drizzle-orm";

import { Database, discordWatches } from "@runeprofile/db";
import {
  AccountType,
  ActivityEvent,
  NewItemObtainedEvent,
} from "@runeprofile/runescape";

import { createDiscordApi } from "~/discord/factory";
import {
  buildPlayerTitle,
  getItemIconUrl,
  getItemName,
} from "~/discord/helpers";

export async function sendActivityMessages(params: {
  db: Database;
  discordToken: string;
  activities: ActivityEvent[];
  accountId: string;
  rsn: string;
  accountType?: AccountType;
  clanName?: string;
}) {
  const {
    db,
    discordToken,
    accountId,
    clanName,
    activities,
    rsn,
    accountType,
  } = params;

  if (activities.length === 0) return;

  // Build embeds for supported activity types
  const embeds = activities
    .map((activity) => createActivityEmbed(activity, rsn, accountType))
    .filter((embed): embed is Embed => embed !== null);

  if (embeds.length === 0) return;

  // Find channels watching this player or clan
  const condition = getWatchCondition({ accountId, clanName });
  if (!condition) return;

  const watches = await db.query.discordWatches.findMany({
    where: condition,
  });
  if (watches.length === 0) return;

  const discordApi = createDiscordApi(discordToken);

  // Send messages to all watching channels
  await Promise.all(
    watches.map(async (watch) => {
      try {
        await discordApi(
          "POST",
          "/channels/{channel.id}/messages",
          [watch.channelId],
          { embeds },
        );
      } catch (error) {
        console.error(
          `Failed to send message to channel ${watch.channelId}:`,
          error,
        );
      }
    }),
  );
}

function createNewItemObtainedEmbed(
  event: NewItemObtainedEvent,
  rsn: string,
  accountType?: AccountType,
): Embed {
  const itemName = getItemName(event.data.itemId);

  return new Embed()
    .title(buildPlayerTitle(rsn, accountType))
    .description(`**${itemName}**`)
    .thumbnail({ url: getItemIconUrl(event.data.itemId) })
    .footer({ text: "New Collection Log Item" })
    .timestamp(new Date().toISOString())
    .color(0x00ff00); // Green
}

function createActivityEmbed(
  activity: ActivityEvent,
  rsn: string,
  accountType?: AccountType,
): Embed | null {
  switch (activity.type) {
    case "new_item_obtained":
      return createNewItemObtainedEmbed(activity, rsn, accountType);
    default:
      // Other event types not yet supported
      return null;
  }
}

function getWatchCondition(params: { accountId?: string; clanName?: string }) {
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
        eq(discordWatches.targetId, clanName),
      ),
    );
  }

  if (conditions.length === 0) {
    return null;
  }

  return or(...conditions);
}
