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
  type ActivityThresholdConfig,
  type ChannelActivityFilters,
  PASS_EVERYTHING_CHANNEL_SETTINGS,
  getActivityThresholdConfig,
  parseThresholdInput,
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
  type RemoveFilterKind,
  applyListFilter,
  applyThreshold,
  getActivityTypeLabel,
  getChannelSettings,
  removeFilter,
  resetChannelSettings,
  saveChannelSettings,
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
            "Minimum value — pick a suggestion or type your own (e.g. 50, 750k, 5m)",
            "String",
          )
            .autocomplete()
            .required(),
        ),
        new SubCommand("remove", "Remove a filter from this channel").options(
          new Option("activity", "Activity filter to remove")
            .choices(...ActivityEventChoices)
            .required(),
          new Option("filter", "Which filter to remove (default: everything)")
            .choices(
              { name: "Everything", value: "all" },
              { name: "Allow/Block", value: "list" },
              { name: "Threshold", value: "threshold" },
            ),
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
          String(c.focused.value ?? ""),
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
              const added = await addPlayerWatch({ db, channelId, rsn });
              if (!added) {
                return c.res(`Already watching player: ${rsn}`);
              }
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
              const added = await addClanWatch({ db, channelId, clanName });
              if (!added) {
                return c.res(`Already watching clan: ${clanName}`);
              }
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
            case "allow":
            case "block": {
              const activityType = c.var.activity as ActivityEventTypeValue;
              const mode =
                c.sub.command === "allow" ? "allowlist" : "blocklist";
              const current = await getChannelSettings({ db, channelId });
              const { settings, notice } = applyListFilter(
                current.settings,
                activityType,
                mode,
              );
              await saveChannelSettings({ db, channelId, settings });

              const reply = `Added ${c.sub.command} filter for: ${getActivityTypeLabel(activityType)}`;
              return c.res(notice ? `${reply}\n\n${notice}` : reply);
            }
            case "threshold": {
              const activityType = c.var.activity as ActivityEventTypeValue;
              const rawValue = c.var.value as string;
              const config = getActivityThresholdConfig(activityType);

              if (!config) {
                return c.res(
                  `${getActivityTypeLabel(activityType)} doesn't support a threshold.`,
                );
              }
              const value = parseThresholdValue(config, rawValue);
              if (value === undefined) {
                return c.res(
                  `Couldn't read "${rawValue}" as a value — use a number like 5000000, shorthand like 750k / 5m, or pick a suggestion.`,
                );
              }
              if (value < config.min || value > config.max) {
                return c.res(
                  `Threshold for ${getActivityTypeLabel(activityType)} must be between ${config.format(config.min)} and ${config.format(config.max)}.`,
                );
              }

              const current = await getChannelSettings({ db, channelId });
              const { settings } = applyThreshold(
                current.settings,
                activityType,
                value,
              );
              await saveChannelSettings({ db, channelId, settings });
              return c.res(
                `Set ${getActivityTypeLabel(activityType)} threshold to **${config.format(value)}** — only activities at or above this will be sent.`,
              );
            }
            case "remove": {
              const activityType = c.var.activity as ActivityEventTypeValue;
              const kind = (c.var.filter ?? "all") as RemoveFilterKind;
              const current = await getChannelSettings({ db, channelId });
              const { settings, removed, notice } = removeFilter(
                current.settings,
                activityType,
                kind,
              );
              if (!removed) {
                return c.res(
                  `No matching filter found for: ${getActivityTypeLabel(activityType)}`,
                );
              }
              await saveChannelSettings({ db, channelId, settings });

              const what =
                kind === "all"
                  ? "all filters"
                  : kind === "list"
                    ? "the allow/block filter"
                    : "the threshold";
              const reply = `Removed ${what} for: ${getActivityTypeLabel(activityType)}`;
              return c.res(notice ? `${reply}\n\n${notice}` : reply);
            }
            case "list": {
              const { settings, isDefault } = await getChannelSettings({
                db,
                channelId,
              });
              const prefix = isDefault
                ? "This channel uses the default filters.\n\n"
                : "";
              return c.res(prefix + formatFilters(settings.filters));
            }
            case "reset": {
              await resetChannelSettings({ db, channelId });
              const { settings } = await getChannelSettings({ db, channelId });
              return c.res(
                `Reset to the default filters.\n\n${formatFilters(settings.filters)}`,
              );
            }
            case "clear": {
              await saveChannelSettings({
                db,
                channelId,
                settings: structuredClone(PASS_EVERYTHING_CHANNEL_SETTINGS),
              });
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

/**
 * Parses the threshold `value` input: numbers and k/m/b shorthand via
 * `parseThresholdInput`, plus formatted names (e.g. "Experienced", "Hard")
 * for tier-like types with a small value range.
 */
function parseThresholdValue(
  config: ActivityThresholdConfig,
  raw: string,
): number | undefined {
  const parsed = parseThresholdInput(raw);
  if (parsed !== undefined) return parsed;

  const needle = raw.trim().toLowerCase();
  if (!needle || config.max - config.min > 20) return undefined;
  for (let value = config.min; value <= config.max; value++) {
    if (config.format(value).toLowerCase() === needle) return value;
  }
  return undefined;
}

function getThresholdValueAutocomplete(
  activityType: ActivityEventTypeValue | undefined,
  typed: string,
): Autocomplete {
  if (!activityType) return new Autocomplete();
  const config = getActivityThresholdConfig(activityType);
  if (!config) return new Autocomplete();

  const choices: { name: string; value: string }[] = [];
  const needle = typed.trim().toLowerCase();

  // Echo the user's own (parsed) input first, so typing "7m" shows "7M gp"
  // as live confirmation of what will be set.
  const typedValue = needle ? parseThresholdValue(config, typed) : undefined;
  if (
    typedValue !== undefined &&
    typedValue >= config.min &&
    typedValue <= config.max
  ) {
    choices.push({ name: config.format(typedValue), value: String(typedValue) });
  }

  // Suggestions, narrowed by name while the user types (e.g. "gr" ->
  // "Grandmaster"). If nothing matches, fall back to the full list.
  const matching = config.suggestions.filter(
    (suggestion) =>
      suggestion !== typedValue &&
      (!needle || config.format(suggestion).toLowerCase().includes(needle)),
  );
  const rest = matching.length
    ? matching
    : config.suggestions.filter((suggestion) => suggestion !== typedValue);
  for (const suggestion of rest) {
    choices.push({ name: config.format(suggestion), value: String(suggestion) });
  }

  return new Autocomplete().choices(...choices);
}

function formatFilters(filters: ChannelActivityFilters): string {
  const thresholds = Object.entries(filters.thresholds);
  const isAllowlist = filters.mode === "allowlist";

  if (filters.types.length === 0 && thresholds.length === 0) {
    return "No activity filters set for this channel. All activity types will be sent.";
  }

  let message = "**Activity Filters**\n";

  if (filters.types.length > 0) {
    message += isAllowlist ? "\n✅ **Allowed:**\n" : "\n🚫 **Blocked:**\n";
    message += filters.types
      .map((type) => `- ${getActivityTypeLabel(type as ActivityEventTypeValue)}`)
      .join("\n");
  }

  if (thresholds.length > 0) {
    message += "\n📊 **Thresholds:**\n";
    message += thresholds
      .map(([type, threshold]) => {
        const activityType = type as ActivityEventTypeValue;
        const config = getActivityThresholdConfig(activityType);
        const value = config ? config.format(threshold) : String(threshold);
        return `- ${getActivityTypeLabel(activityType)} — minimum ${value}`;
      })
      .join("\n");
  }

  if (isAllowlist) {
    message += "\n\n*Only allowed activity types will be sent";
  } else {
    message += "\n\n*All activity types except blocked ones will be sent";
  }
  message += thresholds.length > 0 ? ", subject to thresholds.*" : ".*";

  return message;
}
