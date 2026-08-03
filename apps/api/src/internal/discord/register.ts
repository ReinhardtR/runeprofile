// run using pnpm script to register commands with discord api
import { register } from "discord-hono";

import { isProdDiscordBot } from "~/internal/discord/constants";
import { factory } from "~/internal/discord/factory";
import * as interactions from "~/internal/discord/interactions";

const applicationId = process.env.DISCORD_APPLICATION_ID;
const token = process.env.DISCORD_TOKEN;

// CI passes these as secrets rather than an env file, where a missing one
// would otherwise surface as an opaque fetch failure.
if (!applicationId || !token) {
  console.error(
    "Missing DISCORD_APPLICATION_ID and/or DISCORD_TOKEN — set them in .dev.vars, .env, or the workflow secrets.",
  );
  process.exit(1);
}

console.log(
  `Registering commands for the ${isProdDiscordBot(applicationId) ? "prod" : "dev"} bot (${applicationId})`,
);

register(
  factory.getCommands(Object.values(interactions)),
  applicationId,
  token,
);
