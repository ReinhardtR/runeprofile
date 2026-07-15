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
