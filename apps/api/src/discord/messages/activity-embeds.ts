import { Embed } from "discord-hono";

import {
  AccountType,
  ActivityEvent,
  NewItemObtainedEvent,
} from "@runeprofile/runescape";

import {
  buildPlayerTitle,
  getItemIconUrl,
  getItemName,
  numberWithDelimiter,
} from "~/discord/helpers";

export function createActivityEmbed(params: {
  discordApplicationId: string;
  activity: ActivityEvent;
  rsn: string;
  accountType?: AccountType;
}): Embed | null {
  const { discordApplicationId, activity, rsn, accountType } = params;
  switch (activity.type) {
    case "new_item_obtained":
      return createNewItemObtainedEmbed({
        event: activity,
        discordApplicationId,
        rsn,
        accountType,
      });
    case "valuable_drop":
      return createValuableDropEmbed({
        event: activity as ActivityEvent & { type: "valuable_drop" },
        discordApplicationId,
        rsn,
        accountType,
      });
    default:
      // Other event types not yet supported
      return null;
  }
}

function createNewItemObtainedEmbed(params: {
  discordApplicationId: string;
  event: NewItemObtainedEvent;
  rsn: string;
  accountType?: AccountType;
}): Embed {
  const { discordApplicationId, event, rsn, accountType } = params;
  const itemName = getItemName(event.data.itemId);

  return new Embed()
    .title(buildPlayerTitle({ discordApplicationId, rsn, accountType }))
    .description(`**${itemName}**`)
    .thumbnail({ url: getItemIconUrl(event.data.itemId) })
    .footer({ text: "New Collection Log" })
    .color(0x00ff00); // Green
}

function createValuableDropEmbed(params: {
  discordApplicationId: string;
  event: ActivityEvent & { type: "valuable_drop" };
  rsn: string;
  accountType?: AccountType;
}): Embed {
  const { discordApplicationId, event, rsn, accountType } = params;
  const { itemId, value } = event.data;

  // Determine color based on value
  const color =
    value >= 10_000_000
      ? 0xff006e // Neon pink for 10m+
      : 0xffd700; // Gold for 1m+

  return new Embed()
    .title(buildPlayerTitle({ discordApplicationId, rsn, accountType }))
    .description(`**${numberWithDelimiter(value)} gp**`)
    .thumbnail({ url: getItemIconUrl(itemId) })
    .footer({ text: "Valuable Drop" })
    .color(color);
}
