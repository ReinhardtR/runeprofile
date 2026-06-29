// run using pnpm script to register commands with discord api
import { register } from "discord-hono";

import { factory } from "~/internal/discord/factory";
import * as interactions from "~/internal/discord/interactions";

register(
  factory.getCommands(Object.values(interactions)),
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN,
);
