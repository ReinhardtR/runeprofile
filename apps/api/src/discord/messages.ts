import { MessageFlags } from "discord-api-types/v10";
import { Button, Content, Embed, Layout } from "discord-hono";
import { and, eq, or } from "drizzle-orm";

import { Database, discordWatches } from "@runeprofile/db";
import { AccountType, ActivityEvent } from "@runeprofile/runescape";

import { createDiscordApi } from "~/discord/factory";

const spaced = (str: string) => (str ? `${str} ` : "");

const AccountTypeEmojis: Record<AccountType["id"], string> = {
  0: "",
  1: "<:ironman:1426652503243493519>",
  2: "<:ultimate_ironman:1426652465465528460>",
  3: "<:hardcore_ironman:1426652414693343344>",
  4: "<:group_ironman:1426652372054315161>",
  5: "<:hardcore_group_ironman:1426652397274529892>",
  6: "<:unranked_group_ironman:1426652448118013993>",
};

const getAccountTypeEmoji = (accountType?: AccountType) => {
  if (!accountType) return "";
  return AccountTypeEmojis[accountType.id] ?? "";
};

const getWatchCondition = (params: {
  accountId?: string;
  clanName?: string;
}) => {
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
};

export async function sendActivityMessages(params: {
  db: Database;
  discordToken: string;
  activities: ActivityEvent[];
  accountId: string;
  rsn: string;
  accountType?: AccountType;
  clanName?: string;
}) {
  const { db, discordToken, accountId, clanName, activities } = params;

  if (activities.length === 0) return;

  const condition = getWatchCondition({ accountId, clanName });
  if (!condition) return;

  const watches = await db.query.discordWatches.findMany({
    where: condition,
  });
  if (watches.length === 0) return;

  const discordApi = createDiscordApi(discordToken);

  const component = new Layout("Container").components(
    new Layout("Section")
      .components(
        new Content(
          `### ${spaced(getAccountTypeEmoji(params.accountType))}pgn`,
        ),
        new Content(`### Inquisitor's mace (207,098,781 coins)`),
        new Content(
          `-# Valuable Drop • <t:${Math.floor(Date.now() / 1000)}:R>`,
        ),
      )
      .accessory(
        new Content(
          "https://chisel.weirdgloop.org/static/img/osrs-dii/12934.png",
          "Thumbnail",
        ),
      ),
    // new Layout("Action Row").components(
    //   new Button("https://runeprofile.com/pgn", "", "Link").emoji({
    //     id: "1426917515140923444",
    //     name: "runeprofile",
    //   }),
    //   new Button("https://osrs.wiki", "", "Link").emoji({
    //     id: "1426918290592366663",
    //     name: "wiki",
    //   }),
    // ),
  );

  await Promise.all(
    watches.map(async (watch) => {
      try {
        await discordApi(
          "POST",
          "/channels/{channel.id}/messages",
          [watch.channelId],
          {
            embeds: [
              new Embed()
                .title(
                  `${spaced(getAccountTypeEmoji(params.accountType))}${params.rsn}`,
                )
                .description(`**Inquisitor's mace (207,098,781 coins)**`)
                .thumbnail({
                  url: "https://chisel.weirdgloop.org/static/img/osrs-dii/27198.png",
                })
                .footer({
                  text: "Valuable Drop",
                })
                .timestamp(new Date().toISOString()),
            ],
          },
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

function createActivityMessageContent(params: {
  rsn: string;
  activities: ActivityEvent[];
}) {
  const { rsn, activities } = params;
}
