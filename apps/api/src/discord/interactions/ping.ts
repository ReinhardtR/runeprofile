import { Command, Option } from "discord-hono";

import { factory } from "~/discord/factory";

export const command_ping = factory.command(
  new Command("ping", "Replies with Pong!").options(
    new Option("name", "Your name").required(),
  ),
  (c) => c.res(`hi ${c.var.name}!`),
);
