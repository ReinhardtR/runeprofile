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
  type ActivityEventTypeValue,
  getActivityThresholdConfig,
} from "@runeprofile/runescape";

import {
  getClanAutocomplete,
  getRsnAutocomplete,
} from "~/internal/discord/autocomplete";
import {
  ActivityEventChoices,
  ThresholdActivityChoices,
} from "~/internal/discord/constants";
import { factory } from "~/internal/discord/factory";
import {
  addClanWatch,
  getClanWatches,
  removeClanWatch,
} from "~/internal/discord/watch/clan";
import {
  addWatchFilter,
  clearWatchFilters,
  getActivityTypeLabel,
  getWatchFilters,
  removeWatchFilter,
  resetWatchFilters,
  seedDefaultFiltersIfNew,
  setWatchThreshold,
} from "~/internal/discord/watch/filter";
import {
  addPlayerWatch,
  getPlayerWatches,
  removePlayerWatch,
} from "~/internal/discord/watch/player";
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
        new SubCommand(
          "allow",
          "Only receive this activity type in this channel",
        ).options(
          new Option("activity", "Activity type to allow")
            .choices(...ActivityEventChoices)
            .required(),
        ),
        new SubCommand(
          "block",
          "Stop receiving this activity type in this channel",
        ).options(
          new Option("activity", "Activity type to block")
            .choices(...ActivityEventChoices)
            .required(),
        ),
        new SubCommand(
          "threshold",
          "Only send an activity when it meets a minimum value (e.g. level 50+)",
        ).options(
          new Option("activity", "Activity type to set a minimum for")
            .choices(...ThresholdActivityChoices)
            .required(),
          new Option(
            "value",
            "Minimum value — pick a suggestion or type your own",
            "Integer",
          )
            .min_value(0)
            .autocomplete()
            .required(),
        ),
        new SubCommand("remove", "Remove a filter from this channel").options(
          new Option("activity", "Activity filter to remove")
            .choices(...ActivityEventChoices)
            .required(),
        ),
        new SubCommand("list", "List all activity filters for this channel"),
        new SubCommand(
          "reset",
          "Reset this channel back to the default filters",
        ),
        new SubCommand(
          "clear",
          "Remove all activity filters from this channel",
        ),
      ),
    ),
  async (c) => {
    const db = drizzle(c.env.HYPERDRIVE);

    let result = new Autocomplete();
    try {
      if (c.focused?.name === "rsn") {
        result = await getRsnAutocomplete(db, c.focused);
      } else if (c.focused?.name === "clan") {
        result = await getClanAutocomplete(db, c.focused);
      } else if (c.focused?.name === "value") {
        result = getThresholdValueAutocomplete(
          c.var.activity as ActivityEventTypeValue | undefined,
        );
      }
    } catch (error) {
      console.error("Autocomplete error:", error);
    }

    return c.resAutocomplete(result);
  },
  async (c) => {
    const db = drizzle(c.env.HYPERDRIVE);
    const channelId = c.interaction.channel.id;

    try {
      switch (c.sub.group) {
        case "player": {
          const rsn = c.var.rsn;
          switch (c.sub.command) {
            case "add": {
              await addPlayerWatch({ db, channelId, rsn });
              await seedDefaultFiltersIfNew({ db, channelId });
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
          const clanName = c.var.clan;
          switch (c.sub.command) {
            case "add": {
              await addClanWatch({ db, channelId, clanName });
              await seedDefaultFiltersIfNew({ db, channelId });
              return c.res(`Added clan watch for: ${clanName}`);
            }
            case "remove": {
              await removeClanWatch({ db, channelId, clanName });
              return c.res(`Removed clan watch for: ${clanName}`);
            }
            case "list": {
              const watches = await getClanWatches({ db, channelId });
              if (watches.length === 0) {
                return c.res("Your clan watch list is empty.");
              }

              return c.res(
                `You're watching the following clans:\n${watches.join(", ")}`,
              );
            }
            default: {
              return c.res("Unknown clan subcommand");
            }
          }
        }
        case "filter": {
          switch (c.sub.command) {
            case "allow": {
              const activityType = c.var.activity as ActivityEventTypeValue;
              await addWatchFilter({
                db,
                channelId,
                activityType,
                mode: "allow",
              });
              return c.res(
                `Added allow filter for: ${getActivityTypeLabel(activityType)}`,
              );
            }
            case "block": {
              const activityType = c.var.activity as ActivityEventTypeValue;
              await addWatchFilter({
                db,
                channelId,
                activityType,
                mode: "block",
              });
              return c.res(
                `Added block filter for: ${getActivityTypeLabel(activityType)}`,
              );
            }
            case "threshold": {
              const activityType = c.var.activity as ActivityEventTypeValue;
              const value = c.var.value as number;
              const config = getActivityThresholdConfig(activityType);

              if (!config) {
                return c.res(
                  `${getActivityTypeLabel(activityType)} doesn't support a threshold.`,
                );
              }
              if (value < config.min || value > config.max) {
                return c.res(
                  `Threshold for ${getActivityTypeLabel(activityType)} must be between ${config.min} and ${config.max}.`,
                );
              }

              await setWatchThreshold({
                db,
                channelId,
                activityType,
                threshold: value,
              });
              return c.res(
                `Set ${getActivityTypeLabel(activityType)} threshold to **${config.format(value)}** — only activities at or above this will be sent.`,
              );
            }
            case "remove": {
              const activityType = c.var.activity as ActivityEventTypeValue;
              const removed = await removeWatchFilter({
                db,
                channelId,
                activityType,
              });
              if (!removed) {
                return c.res(
                  `No filter found for: ${getActivityTypeLabel(activityType)}`,
                );
              }
              return c.res(
                `Removed all filters for: ${getActivityTypeLabel(activityType)}`,
              );
            }
            case "list": {
              const filters = await getWatchFilters({ db, channelId });
              if (filters.length === 0) {
                return c.res(
                  "No activity filters set for this channel. All activity types will be sent.",
                );
              }

              return c.res(formatFilterList(filters));
            }
            case "reset": {
              await resetWatchFilters({ db, channelId });
              const filters = await getWatchFilters({ db, channelId });
              return c.res(
                `Reset to the default filters.\n\n${formatFilterList(filters)}`,
              );
            }
            case "clear": {
              await clearWatchFilters({ db, channelId });
              return c.res(
                "Cleared all activity filters. All activity types will be sent.",
              );
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

function getThresholdValueAutocomplete(
  activityType: ActivityEventTypeValue | undefined,
): Autocomplete {
  if (!activityType) return new Autocomplete();
  const config = getActivityThresholdConfig(activityType);
  if (!config) return new Autocomplete();

  return new Autocomplete().choices(
    ...config.suggestions.map((value) => ({
      name: config.format(value),
      value,
    })),
  );
}

function formatFilterList(
  filters: {
    activityType: string;
    mode: "allow" | "block" | null;
    threshold: number | null;
  }[],
): string {
  const allowFilters = filters.filter((f) => f.mode === "allow");
  const blockFilters = filters.filter((f) => f.mode === "block");
  const thresholdFilters = filters.filter((f) => f.threshold !== null);

  let message = "**Activity Filters**\n";

  if (allowFilters.length > 0) {
    message += "\n✅ **Allowed:**\n";
    message += allowFilters
      .map(
        (f) =>
          `- ${getActivityTypeLabel(f.activityType as ActivityEventTypeValue)}`,
      )
      .join("\n");
  }

  if (blockFilters.length > 0) {
    message += "\n🚫 **Blocked:**\n";
    message += blockFilters
      .map(
        (f) =>
          `- ${getActivityTypeLabel(f.activityType as ActivityEventTypeValue)}`,
      )
      .join("\n");
  }

  if (thresholdFilters.length > 0) {
    message += "\n📊 **Thresholds:**\n";
    message += thresholdFilters
      .map((f) => {
        const type = f.activityType as ActivityEventTypeValue;
        const config = getActivityThresholdConfig(type);
        const value =
          config && f.threshold !== null
            ? config.format(f.threshold)
            : String(f.threshold);
        return `- ${getActivityTypeLabel(type)} — minimum ${value}`;
      })
      .join("\n");
  }

  if (allowFilters.length > 0) {
    message += "\n\n*Only allowed activity types will be sent";
    message += thresholdFilters.length > 0 ? ", subject to thresholds.*" : ".*";
  } else if (blockFilters.length > 0 || thresholdFilters.length > 0) {
    message += "\n\n*All activity types except blocked ones will be sent";
    message += thresholdFilters.length > 0 ? ", subject to thresholds.*" : ".*";
  }

  return message;
}
