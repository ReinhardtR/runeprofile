import {
  InteractionContextType,
  PermissionFlagsBits,
} from "discord-api-types/v10";
import {
  Autocomplete,
  Command,
  Option,
  SubCommand,
  SubGroup,
} from "discord-hono";

import { drizzle } from "@runeprofile/db";

import {
  getClanAutocomplete,
  getRsnAutocomplete,
} from "~/discord/autocomplete";
import { ActivityEventChoices } from "~/discord/constants";
import { factory } from "~/discord/factory";
import {
  addPlayerWatch,
  getPlayerWatches,
  removePlayerWatch,
} from "~/discord/watch";
import { RuneProfileError } from "~/lib/errors";

export const command_watch = factory.autocomplete(
  new Command(
    "watch",
    "Watch players or clans, and automatically send their activities in this channel.",
  )
    .default_member_permissions(PermissionFlagsBits.ManageChannels.toString())
    .contexts(InteractionContextType.Guild)
    .options(
      new SubGroup("player", "Manage player watch list").options(
        new SubCommand("add", "Add a player to your watch list").options(
          new Option("rsn", "Player In-game Name").autocomplete().required(),
        ),
        new SubCommand(
          "remove",
          "Remove a player from your watch list",
        ).options(
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

      new SubGroup(
        "filter",
        "Manage activity filters for this channel",
      ).options(
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

    let result = new Autocomplete();
    if (c.focused?.name === "rsn") {
      result = await getRsnAutocomplete(db, c.focused);
    } else if (c.focused?.name === "clan") {
      result = await getClanAutocomplete(db, c.focused);
    }

    return c.resAutocomplete(result);
  },
  async (c) => {
    const db = drizzle(c.env.DB);
    const channelId = c.interaction.channel.id;

    try {
      switch (c.sub.group) {
        case "player": {
          const rsn = c.var.rsn;
          switch (c.sub.command) {
            case "add": {
              await addPlayerWatch({ db, channelId, rsn });
              return c.res(`Added player watch for: ${rsn}`);
            }
            case "remove": {
              await removePlayerWatch({ db, channelId, rsn });
              return c.res(`Removed player watch for: ${rsn}`);
            }
            case "list": {
              const watches = await getPlayerWatches({ db, channelId });
              if (watches.length === 0) {
                return c.res("Your player watch list is empty.");
              }

              return c.res(
                `You're watching the following players:\n${watches.join(", ")}`,
              );
            }
            default: {
              return c.res("Unknown player subcommand");
            }
          }
        }
        case "clan": {
          switch (c.sub.command) {
            case "add": {
              return c.res(`Added clan watch for: ${c.var.clan}`);
            }
            case "remove": {
              return c.res(`Removed clan watch for: ${c.var.clan}`);
            }
            case "list": {
              return c.res("Your clan watch list is empty.");
            }
            default: {
              return c.res("Unknown clan subcommand");
            }
          }
        }
        case "filter": {
          switch (c.sub.command) {
            case "add": {
              return c.res("Filter add: " + c.var.activity);
            }
            case "remove": {
              return c.res("Filter remove: " + c.var.activity);
            }
            case "list": {
              return c.res("Filter list");
            }
            default: {
              return c.res("Unknown filter subcommand");
            }
          }
        }
        default: {
          return c.res("Unknown sub group");
        }
      }
    } catch (e) {
      if (e instanceof RuneProfileError) {
        return c.res(e.message);
      }
      return c.res("An unknown error occurred.");
    }
  },
);
