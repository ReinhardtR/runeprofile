import { ActivityEventType } from "@runeprofile/runescape";

export const PROD_DISCORD_APPLICATION_ID = "1265357157176705034";
export const DEV_DISCORD_APPLICATION_ID = "1421786411408822272";

export function isProdDiscordBot(applicationId: string): boolean {
  return applicationId === PROD_DISCORD_APPLICATION_ID;
}

export const ActivityEventChoices = Object.values(ActivityEventType).map(
  (type) => ({
    name: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: type,
  }),
);
