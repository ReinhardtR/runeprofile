import { Embed } from "discord-hono";
import { z } from "zod";

import {
  type AccountType,
  AccountTypes,
  ActivityEventSchema,
} from "@runeprofile/runescape";

import { isProdDiscordBot } from "~/internal/discord/constants";
import { createDiscordApi } from "~/internal/discord/factory";
import { createActivityEmbed } from "~/internal/discord/messages/activity-embeds";
import { newRouter } from "~/lib/helpers";
import { STATUS } from "~/lib/status";
import { validator } from "~/lib/validation";

export const simulateRouter = newRouter().post(
  "/discord",
  validator(
    "json",
    z.object({
      channelId: z.string().min(1),
      activities: z.array(ActivityEventSchema).min(1).max(25),
      rsn: z.string().min(1).max(12),
      accountType: z.number().int().min(0).max(6).optional(),
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

    const { channelId, activities, rsn, accountType } = c.req.valid("json");

    const acct: AccountType | undefined =
      accountType != null ? AccountTypes[accountType] : undefined;

    const embeds = activities.map((activity) =>
      createActivityEmbed({
        activity,
        discordApplicationId: c.env.DISCORD_APPLICATION_ID,
        rsn,
        accountType: acct,
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
  },
);
