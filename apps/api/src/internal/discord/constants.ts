import {
  ACTIVITY_FILTER_META,
  FILTERABLE_ACTIVITY_TYPES,
  THRESHOLD_ACTIVITY_TYPES,
  getActivityTypeLabel,
} from "@runeprofile/runescape";

export const PROD_DISCORD_APPLICATION_ID = "1265357157176705034";
export const DEV_DISCORD_APPLICATION_ID = "1421786411408822272";

export function isProdDiscordBot(applicationId: string): boolean {
  return applicationId === PROD_DISCORD_APPLICATION_ID;
}

/**
 * Clans whose activity goes out as rendered cards instead of embeds, while
 * the cards are in beta. Lowercase, since clan names are matched that way
 * everywhere else.
 */
const CARD_BETA_CLANS = new Set(["the pax"]);

/**
 * Whether a player's activity is posted as cards.
 *
 * Keyed on the player's own clan rather than on what a channel watches, so
 * a member's activity looks the same wherever it is followed - a channel
 * watching them individually shows cards too. Players outside the beta keep
 * the embeds.
 */
export function usesActivityCards(clanName: string | null): boolean {
  return clanName != null && CARD_BETA_CLANS.has(clanName.toLowerCase());
}

// All filterable activity types, for the allow/block/remove filters.
export const ActivityEventChoices = FILTERABLE_ACTIVITY_TYPES.map((type) => ({
  name: getActivityTypeLabel(type),
  value: type,
}));

// Only threshold-able activity types, for the threshold filter.
export const ThresholdActivityChoices = THRESHOLD_ACTIVITY_TYPES.map((type) => {
  const config = ACTIVITY_FILTER_META[type].threshold;
  return {
    name: config
      ? `${getActivityTypeLabel(type)} (${config.unit})`
      : getActivityTypeLabel(type),
    value: type,
  };
});
