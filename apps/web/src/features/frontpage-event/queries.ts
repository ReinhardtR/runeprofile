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
    // Overrides the app-wide staleTime: Infinity. With that, a fetch that
    // failed or never settled (e.g. around a deploy) left the board on its
    // placeholders for the rest of the session, even after navigating away
    // and back. Stale after a minute so returning to the homepage refetches,
    // and polled so an open tab follows the 10-minute cron.
    staleTime: 60_000,
    refetchInterval: 10 * 60_000,
  });
}
