import { Embed } from "discord-hono";
import { z } from "zod";

import {
  type AccountType,
  AccountTypes,
  ActivityEventSchema,
} from "@runeprofile/runescape";

import { isProdDiscordBot } from "~/internal/discord/constants";
import {
  type CardDesign,
  activityAltText,
  renderActivityCardPng,
  renderAvatarDataUri,
} from "~/internal/discord/cards/activity-cards";
import { createDiscordApi } from "~/internal/discord/factory";
import { createActivityEmbed } from "~/internal/discord/messages/activity-embeds";
import { newRouter } from "~/lib/helpers";
import { STATUS } from "~/lib/status";
import { validator } from "~/lib/validation";

const simulateBodySchema = z.object({
  channelId: z.string().min(1),
  activities: z.array(ActivityEventSchema).min(1).max(25),
  rsn: z.string().min(1).max(12),
  accountType: z.number().int().min(0).max(6).optional(),
  format: z.enum(["embeds", "cards"]).default("embeds"),
  size: z.enum(["full", "slim", "compact"]).optional(),
  displayWidth: z.number().int().min(320).max(1440).optional(),
});

export const simulateRouter = newRouter()
  .post(
    "/discord",
    validator("json", simulateBodySchema),
    async (c) => {
      // Block in production to prevent misuse
      if (isProdDiscordBot(c.env.DISCORD_APPLICATION_ID)) {
        return c.json(
          {
            code: "Forbidden",
            message: "Simulate endpoint is disabled in production.",
          },
          STATUS.FORBIDDEN,
        );
      }

      const {
        channelId,
        activities,
        rsn,
        accountType,
        format,
        size,
        displayWidth,
      } = c.req.valid("json");

      const acct: AccountType | undefined =
        accountType != null ? AccountTypes[accountType] : undefined;

      // Only the keys that were actually sent: spreading an explicit
      // undefined over the card defaults would erase them.
      const design: CardDesign = {};
      if (size) design.size = size;
      if (displayWidth) design.displayWidth = displayWidth;

      if (format === "cards") {
        // One PNG per activity, attached directly to the message so no
        // public URL is needed. The portrait is rendered once and shared.
        const avatarDataUri = await renderAvatarDataUri(
          c.env.BUCKET,
          rsn,
          design,
        );
        const cards: { file: Uint8Array; alt: string }[] = [];
        for (const activity of activities) {
          cards.push({
            file: await renderActivityCardPng({
              activity,
              rsn,
              accountType: acct,
              avatarDataUri,
              design,
            }),
            alt: activityAltText(activity, rsn),
          });
        }

        // Discord allows max 10 attachments per message
        for (let i = 0; i < cards.length; i += 10) {
          const batch = cards.slice(i, i + 10);
          await postCardsMessage({
            token: c.env.DISCORD_TOKEN,
            channelId,
            cards: batch,
          });
        }

        return c.json({ sent: cards.length }, STATUS.OK);
      }

      const embeds = activities.map((activity, index) =>
        createActivityEmbed({
          activity,
          discordApplicationId: c.env.DISCORD_APPLICATION_ID,
          rsn,
          accountType: acct,
          index,
        }),
      );

      if (embeds.length === 0) {
        return c.json(
          {
            code: "NoEmbeds",
            message:
              "No valid embeds could be built from the provided activities.",
          },
          STATUS.BAD_REQUEST,
        );
      }

      const discordApi = createDiscordApi(c.env.DISCORD_TOKEN);

      // Discord allows max 10 embeds per message
      const batches: Embed[][] = [];
      for (let i = 0; i < embeds.length; i += 10) {
        batches.push(embeds.slice(i, i + 10));
      }

      for (const batch of batches) {
        await discordApi(
          "POST",
          "/channels/{channel.id}/messages",
          [channelId],
          {
            embeds: batch,
          },
        );
      }

      return c.json({ sent: embeds.length }, STATUS.OK);
    },
  )
  .post(
    "/discord/card-preview",
    validator(
      "json",
      simulateBodySchema.omit({ channelId: true }).extend({
        // Experimental design switches so alternatives can be compared
        // through the real pipeline; production sends use the defaults.
        design: z
          .object({
            bg: z
              .enum([
                "wash",
                "washSpot",
                "washVertical",
                "washDeep",
                "washDeepSoft",
                "washDeepStrong",
                "texture",
              ])
              .optional(),
            surface: z.enum(["dark", "lifted", "liftedStrong"]).optional(),
            panel: z
              .enum([
                "dark",
                "darkSoft",
                "chip",
                "chipDim",
                "dark70",
                "solid",
                "solidDeep",
              ])
              .optional(),
            modelFade: z.enum(["soft", "light", "none"]).optional(),
            size: z.enum(["full", "slim", "compact"]).optional(),
            displayWidth: z.number().int().min(320).max(1440).optional(),
            supersample: z.union([z.literal(1), z.literal(2)]).optional(),
            name: z.enum(["gold", "white", "accent", "orange", "cyan", "cream"]).optional(),
            footer: z.enum(["full", "minimal"]).optional(),
          })
          .optional(),
        // Renders raw HTML instead of a card — for debugging the layout
        // engine from the simulator. Dev-only like the rest of the route.
        debugHtml: z.string().optional(),
      }),
    ),
    async (c) => {
      // Block in production to prevent misuse
      if (isProdDiscordBot(c.env.DISCORD_APPLICATION_ID)) {
        return c.json(
          {
            code: "Forbidden",
            message: "Simulate endpoint is disabled in production.",
          },
          STATUS.FORBIDDEN,
        );
      }

      if (c.req.valid("json").debugHtml) {
        const { renderDebugHtml } = await import(
          "~/internal/discord/cards/activity-cards"
        );
        const png = await renderDebugHtml(
          c.req.valid("json").debugHtml!,
          c.req.valid("json").design,
        );
        return new Response(png as unknown as BodyInit, {
          headers: { "Content-Type": "image/png" },
        });
      }

      const { activities, rsn, accountType, design } = c.req.valid("json");
      const acct: AccountType | undefined =
        accountType != null ? AccountTypes[accountType] : undefined;

      const avatarDataUri = await renderAvatarDataUri(c.env.BUCKET, rsn, design);
      const png = await renderActivityCardPng({
        activity: activities[0]!,
        rsn,
        accountType: acct,
        avatarDataUri,
        design,
      });

      return new Response(png as unknown as BodyInit, {
        headers: { "Content-Type": "image/png" },
      });
    },
  );

async function postCardsMessage(params: {
  token: string;
  channelId: string;
  cards: { file: Uint8Array; alt: string }[];
}) {
  const { token, channelId, cards } = params;

  const form = new FormData();
  form.append(
    "payload_json",
    JSON.stringify({
      // One embed per card, each holding just the image.
      //
      // An embed's image column is narrower than a components v2 media
      // gallery, and that is the point: Discord sizes an image from its own
      // pixel width, so a gallery big enough to stay sharp on a high-DPI
      // screen is also as wide as the message column. An embed caps the
      // image well below that and scales the file down to fit, which leaves
      // room to send a card at twice its displayed size — small on screen
      // and still crisp.
      //
      // One embed each rather than several images on one, because bare
      // attachments get cropped into a mosaic gallery. No description and
      // no content: the card carries its own text, and a caption above the
      // artwork read as bolted on. The color matches the card background so
      // the embed's accent strip blends away.
      embeds: cards.map((_, i) => ({
        image: { url: `attachment://activity-${i}.png` },
        color: 0x0d0d0c,
      })),
      // Alt text lives on the attachment, the only place Discord accepts it
      // for an embed image.
      attachments: cards.map((card, i) => ({
        id: i,
        filename: `activity-${i}.png`,
        description: card.alt,
      })),
    }),
  );
  for (let i = 0; i < cards.length; i++) {
    form.append(
      `files[${i}]`,
      new Blob([cards[i]!.file as unknown as BlobPart], {
        type: "image/png",
      }),
      `activity-${i}.png`,
    );
  }

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bot ${token}` },
      body: form,
    },
  );
  if (!response.ok) {
    throw new Error(
      `Discord message with attachments failed (${response.status}): ${await response.text()}`,
    );
  }
}
