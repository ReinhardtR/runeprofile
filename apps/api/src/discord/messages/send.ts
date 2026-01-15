import { Embed } from "discord-hono";
import { and, eq, or } from "drizzle-orm";

import { Database, discordWatches } from "@runeprofile/db";
import { AccountType, ActivityEvent } from "@runeprofile/runescape";

import { createDiscordApi } from "~/discord/factory";
import { createActivityEmbed } from "~/discord/messages/activity-embeds";

export async function sendActivityMessages(params: {
  db: Database;
  discordToken: string;
  discordApplicationId: string;
  activities: ActivityEvent[];
  accountId: string;
  rsn: string;
  accountType?: AccountType;
  clanName?: string;
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

  // Build embeds for supported activity types
  const embeds = activities
    .map((activity) =>
      createActivityEmbed({ activity, discordApplicationId, rsn, accountType }),
    )
    .filter((embed): embed is Embed => embed !== null);

  if (embeds.length === 0) {
    console.log("No supported activity embeds to send");
    return;
  }

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

  const discordApi = createDiscordApi(discordToken);

  // Send messages to all watching channels
  await Promise.allSettled(
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

  console.log(`Sent activity messages to ${watches.length} channels`);
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
