import { Embed } from "discord-hono";
import { z } from "zod";

import {
  type AccountType,
  AccountTypes,
  ActivityEventSchema,
} from "@runeprofile/runescape";

import {
  activityAltText,
  renderActivityCardPng,
  renderAvatarDataUri,
} from "~/internal/discord/cards/activity-cards";
import { isProdDiscordBot } from "~/internal/discord/constants";
import { createDiscordApi } from "~/internal/discord/factory";
import { createActivityEmbed } from "~/internal/discord/messages/activity-embeds";
import {
  MAX_CARDS_PER_MESSAGE,
  postCardsMessage,
} from "~/internal/discord/messages/send-cards";
import { newRouter } from "~/lib/helpers";
import { STATUS } from "~/lib/status";
import { validator } from "~/lib/validation";

const simulateBodySchema = z.object({
  channelId: z.string().min(1),
  activities: z.array(ActivityEventSchema).min(1).max(25),
  rsn: z.string().min(1).max(12),
  accountType: z.number().int().min(0).max(6).optional(),
  format: z.enum(["embeds", "cards"]).default("embeds"),
});

export const simulateRouter = newRouter()
  .post("/discord", validator("json", simulateBodySchema), async (c) => {
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

    const { channelId, activities, rsn, accountType, format } =
      c.req.valid("json");

    const acct: AccountType | undefined =
      accountType != null ? AccountTypes[accountType] : undefined;

    if (format === "cards") {
      // One PNG per activity, attached directly to the message so no
      // public URL is needed. The portrait is rendered once and shared.
      const avatarDataUri = await renderAvatarDataUri(c.env.BUCKET, rsn);
      const cards: { file: Uint8Array; alt: string }[] = [];
      for (const activity of activities) {
        cards.push({
          file: await renderActivityCardPng({
            activity,
            rsn,
            accountType: acct,
            avatarDataUri,
          }),
          alt: activityAltText(activity, rsn),
        });
      }

      for (let i = 0; i < cards.length; i += MAX_CARDS_PER_MESSAGE) {
        const batch = cards.slice(i, i + MAX_CARDS_PER_MESSAGE);
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
      await discordApi("POST", "/channels/{channel.id}/messages", [channelId], {
        embeds: batch,
      });
    }

    return c.json({ sent: embeds.length }, STATUS.OK);
  })
  .post(
    "/discord/card-preview",
    validator("json", simulateBodySchema.omit({ channelId: true })),
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

      const { activities, rsn, accountType } = c.req.valid("json");
      const acct: AccountType | undefined =
        accountType != null ? AccountTypes[accountType] : undefined;

      const avatarDataUri = await renderAvatarDataUri(c.env.BUCKET, rsn);
      const png = await renderActivityCardPng({
        activity: activities[0]!,
        rsn,
        accountType: acct,
        avatarDataUri,
      });

      return new Response(png as unknown as BodyInit, {
        headers: { "Content-Type": "image/png" },
      });
    },
  );
