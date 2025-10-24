import { ActivityEventType } from "@runeprofile/runescape";

export const ActivityEventChoices = Object.values(ActivityEventType).map(
  (type) => ({
    name: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: type,
  }),
);
