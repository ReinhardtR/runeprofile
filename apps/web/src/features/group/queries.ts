import { getGroupActivities } from "~/core/api";

export function groupActivitiesQueryOptions(
  params: Parameters<typeof getGroupActivities>[0],
) {
  return {
    queryKey: ["group", "activities", params],
    queryFn: () => getGroupActivities(params),
  };
}

export type GroupActivityEvent = Awaited<
  ReturnType<typeof getGroupActivities>
>["activities"][number];
