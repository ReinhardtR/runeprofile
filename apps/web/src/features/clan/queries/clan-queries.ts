import { getClanActivities, getClanMembers } from "~/core/api";

export function clanQueryOptions(params: Parameters<typeof getClanMembers>[0]) {
  return {
    queryKey: ["clan", params],
    queryFn: () => getClanMembers(params),
  };
}

export function clanActivitiesQueryOptions(
  params: Parameters<typeof getClanActivities>[0],
) {
  return {
    queryKey: ["clan", "activities", params],
    queryFn: () => getClanActivities(params),
  };
}

export type ClanActivityEvent = Awaited<
  ReturnType<typeof getClanActivities>
>["activities"][number];

export type ClanMember = Awaited<
  ReturnType<typeof getClanMembers>
>["members"][number];
