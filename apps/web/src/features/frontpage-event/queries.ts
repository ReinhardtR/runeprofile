import { queryOptions } from "@tanstack/react-query";

import { getEventLeaderboards, getMetrics } from "~/core/api";

export function metricsQueryOptions() {
  return queryOptions({
    queryKey: ["metrics"],
    queryFn: () => getMetrics(),
  });
}

export function eventLeaderboardsQueryOptions() {
  return queryOptions({
    queryKey: ["event-leaderboards"],
    queryFn: () => getEventLeaderboards(),
  });
}
