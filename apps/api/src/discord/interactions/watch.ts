import {
  Autocomplete,
  Command,
  Option,
  SubCommand,
  SubGroup,
} from "discord-hono";

import { drizzle, lower } from "@runeprofile/db";

import { factory } from "~/discord/factory";
import { ActivityEventChoices } from "~/discord/lib/constants";

export const command_watch = factory.autocomplete(
  new Command(
    "watch",
    "Watch players or clans, and automatically send their activities in this channel.",
  ).options(
    new SubGroup("player", "Manage player watch list").options(
      new SubCommand("add", "Add a player to your watch list").options(
        new Option("rsn", "Player In-game Name").autocomplete().required(),
      ),
      new SubCommand("remove", "Remove a player from your watch list").options(
        new Option("rsn", "Player In-game Name").autocomplete().required(),
      ),
      new SubCommand("list", "List all players you're watching"),
    ),

    new SubGroup("clan", "Manage clan watch list").options(
      new SubCommand("add", "Add a clan to your watch list").options(
        new Option("clan", "Clan name").autocomplete().required(),
      ),
      new SubCommand("remove", "Remove a clan from your watch list").options(
        new Option("clan", "Clan name").autocomplete().required(),
      ),
      new SubCommand("list", "List all clans you're watching"),
    ),

    new SubGroup("filter", "Manage activity filters for this channel").options(
      new SubCommand("add", "Add an activity filter to this channel").options(
        new Option("activity", "Activity to filter")
          .choices(...ActivityEventChoices)
          .required(),
      ),
      new SubCommand(
        "remove",
        "Remove an activity filter from this channel",
      ).options(
        new Option("activity", "Activity filter to remove")
          .choices(...ActivityEventChoices)
          .required(),
      ),
      new SubCommand("list", "List all activity filters for this channel"),
    ),
  ),
  async (c) => {
    const db = drizzle(c.env.DB);

    const query = c.focused?.value.toString();
    if (!query) return c.resAutocomplete(new Autocomplete().choices());

    const players = await db.query.accounts.findMany({
      columns: { username: true, accountType: true },
      where: (accounts, { like }) =>
        like(lower(accounts.username), `${query.toLowerCase()}%`),
      orderBy: (accounts, { asc }) => [asc(lower(accounts.username))],
      limit: 10,
    });

    const options = players.map((p) => ({
      name: p.username,
      value: p.username,
    }));

    return c.resAutocomplete(
      new Autocomplete(c.focused?.value).choices(...options),
    );
  },
  async (c) => {
    return c.res("Complete");
    //   switch (c.sub.group) {
    //     case "player": {
    //       switch (c.sub.command) {
    //         case "add": {
    //           return c.res(`Added player watch for: ${c.var.rsn}`);
    //         }
    //         case "remove": {
    //           return c.res(`Removed player watch for: ${c.var.rsn}`);
    //         }
    //         case "list": {
    //           return c.res("Your player watch list is empty.");
    //         }
    //         default: {
    //           return c.res("Unknown player subcommand");
    //         }
    //       }
    //     }
    //     case "clan": {
    //       switch (c.sub.command) {
    //         case "add": {
    //           return c.res(`Added clan watch for: ${c.var.clan}`);
    //         }
    //         case "remove": {
    //           return c.res(`Removed clan watch for: ${c.var.clan}`);
    //         }
    //         case "list": {
    //           return c.res("Your clan watch list is empty.");
    //         }
    //         default: {
    //           return c.res("Unknown clan subcommand");
    //         }
    //       }
    //     }
    //     case "filter": {
    //       switch (c.sub.command) {
    //         case "add": {
    //           return c.res("Filter add: " + c.var.activity);
    //         }
    //         case "remove": {
    //           return c.res("Filter remove: " + c.var.activity);
    //         }
    //         case "list": {
    //           return c.res("Filter list");
    //         }
    //         default: {
    //           return c.res("Unknown filter subcommand");
    //         }
    //       }
    //     }
    //     default: {
    //       return c.res("Unknown sub group");
    //     }
    //   }
  },
);
