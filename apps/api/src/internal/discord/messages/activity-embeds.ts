import { Embed } from "discord-hono";

import {
  AccountType,
  AchievementDiaryTierCompletedEvent,
  ActivityEvent,
  CombatAchievementTierCompletedEvent,
  CombatAchievementTierReachedEvent,
  LevelUpEvent,
  MaxedEvent,
  NewItemObtainedEvent,
  QuestCompletedEvent,
  ValuableDropEvent,
  XpMilestoneEvent,
  getAchievementDiaryAreaName,
  getAchievementDiaryTierName,
  getCombatAchievementTierName,
  getQuestById,
} from "@runeprofile/runescape";

import {
  buildPlayerTitle,
  getAchievementDiaryIconUrl,
  getCombatAchievementIconUrl,
  getItemIconUrl,
  getItemName,
  getMaxCapeIconUrl,
  getQuestIconUrl,
  getSkillIconUrl,
  numberWithAbbreviation,
  numberWithDelimiter,
} from "~/internal/discord/helpers";

export function createActivityEmbed(params: {
  discordApplicationId: string;
  activity: ActivityEvent;
  rsn: string;
  accountType?: AccountType;
}): Embed {
  const { discordApplicationId, activity, rsn, accountType } = params;
  const common = { discordApplicationId, rsn, accountType };

  switch (activity.type) {
    case "new_item_obtained":
      return createNewItemObtainedEmbed({ ...common, event: activity });
    case "valuable_drop":
      return createValuableDropEmbed({ ...common, event: activity });
    case "level_up":
      return createLevelUpEmbed({ ...common, event: activity });
    case "xp_milestone":
      return createXpMilestoneEmbed({ ...common, event: activity });
    case "quest_completed":
      return createQuestCompletedEmbed({ ...common, event: activity });
    case "achievement_diary_tier_completed":
      return createAchievementDiaryEmbed({ ...common, event: activity });
    case "combat_achievement_tier_completed":
      return createCombatAchievementEmbed({ ...common, event: activity });
    case "combat_achievement_tier_reached":
      return createCombatAchievementEmbed({ ...common, event: activity });
    case "maxed":
      return createMaxedEmbed({ ...common, event: activity });
  }
}

type EmbedParams<T> = {
  discordApplicationId: string;
  event: T;
  rsn: string;
  accountType?: AccountType;
};

function createNewItemObtainedEmbed(
  params: EmbedParams<NewItemObtainedEvent>,
): Embed {
  const { discordApplicationId, event, rsn, accountType } = params;
  const itemName = getItemName(event.data.itemId);

  return new Embed()
    .title(buildPlayerTitle({ discordApplicationId, rsn, accountType }))
    .description(`**${itemName}**`)
    .thumbnail({ url: getItemIconUrl(event.data.itemId) })
    .footer({ text: "Collection Log" })
    .color(0x00ff00); // Green
}

function createValuableDropEmbed(
  params: EmbedParams<ValuableDropEvent>,
): Embed {
  const { discordApplicationId, event, rsn, accountType } = params;
  const { itemId, value } = event.data;

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

function createLevelUpEmbed(params: EmbedParams<LevelUpEvent>): Embed {
  const { discordApplicationId, event, rsn, accountType } = params;
  const { name, level } = event.data;

  return new Embed()
    .title(buildPlayerTitle({ discordApplicationId, rsn, accountType }))
    .description(`Reached level **${level}** in **${name}**`)
    .thumbnail({ url: getSkillIconUrl(name) })
    .footer({ text: "Level Up" })
    .color(0x00ff00); // Green
}

function createXpMilestoneEmbed(params: EmbedParams<XpMilestoneEvent>): Embed {
  const { discordApplicationId, event, rsn, accountType } = params;
  const { name, xp } = event.data;

  return new Embed()
    .title(buildPlayerTitle({ discordApplicationId, rsn, accountType }))
    .description(`Reached **${numberWithAbbreviation(xp)} XP** in **${name}**`)
    .thumbnail({ url: getSkillIconUrl(name) })
    .footer({ text: "XP Milestone" })
    .color(0x3498db); // Blue
}

function createQuestCompletedEmbed(
  params: EmbedParams<QuestCompletedEvent>,
): Embed {
  const { discordApplicationId, event, rsn, accountType } = params;
  const quest = getQuestById(event.data.questId);

  return new Embed()
    .title(buildPlayerTitle({ discordApplicationId, rsn, accountType }))
    .description(`Completed **${quest?.name ?? "Unknown Quest"}**`)
    .thumbnail({ url: getQuestIconUrl() })
    .footer({ text: "Quest" })
    .color(0x00ced1); // Dark cyan
}

function createAchievementDiaryEmbed(
  params: EmbedParams<AchievementDiaryTierCompletedEvent>,
): Embed {
  const { discordApplicationId, event, rsn, accountType } = params;
  const areaName = getAchievementDiaryAreaName(event.data.areaId) ?? "Unknown";
  const tierName = getAchievementDiaryTierName(event.data.tier) ?? "Unknown";

  return new Embed()
    .title(buildPlayerTitle({ discordApplicationId, rsn, accountType }))
    .description(`Completed the **${tierName}** diary in **${areaName}**`)
    .thumbnail({ url: getAchievementDiaryIconUrl() })
    .footer({ text: "Achievement Diary" })
    .color(0xf59e0b); // Amber
}

function createCombatAchievementEmbed(
  params: EmbedParams<
    CombatAchievementTierCompletedEvent | CombatAchievementTierReachedEvent
  >,
): Embed {
  const { discordApplicationId, event, rsn, accountType } = params;
  const tierName = getCombatAchievementTierName(event.data.tierId) ?? "Unknown";
  const isReached = event.type === "combat_achievement_tier_reached";

  let description = isReached
    ? `Reached the **${tierName}** Combat Achievement Tier`
    : `Completed all **${tierName}** Combat Achievements`;

  return new Embed()
    .title(buildPlayerTitle({ discordApplicationId, rsn, accountType }))
    .description(description)
    .thumbnail({ url: getCombatAchievementIconUrl(tierName) })
    .footer({ text: "Combat Achievement Tier" })
    .color(0xef4444); // Red
}

function createMaxedEmbed(params: EmbedParams<MaxedEvent>): Embed {
  const { discordApplicationId, rsn, accountType } = params;

  return new Embed()
    .title(buildPlayerTitle({ discordApplicationId, rsn, accountType }))
    .description("Has **Maxed** all skills! 🎉")
    .thumbnail({ url: getMaxCapeIconUrl() })
    .footer({ text: "Maxed" })
    .color(0xffd700); // Gold
}
