import { factory } from "~/internal/discord/factory";
import * as interactions from "~/internal/discord/interactions";
import { newRouter } from "~/lib/helpers";
import { logFields } from "~/lib/logging";

const discord = factory.discord().loader(Object.values(interactions));

export const discordRouter = newRouter();

// discord-hono handles the interaction internally, so the wide event would
// otherwise only see "POST /discord" — pull the command name out of the
// (cloned) payload before handing the request over.
discordRouter.use(async (c, next) => {
  try {
    const body = (await c.req.raw.clone().json()) as {
      type?: number;
      data?: { name?: string; custom_id?: string };
    };
    logFields(c, {
      discord_interaction_type: body?.type ?? null,
      discord_command: body?.data?.name ?? body?.data?.custom_id ?? null,
    });
  } catch {
    // Not JSON (or unparseable) — signature verification will reject it.
  }
  await next();
});

discordRouter.mount("/", discord.fetch.bind(discord));
