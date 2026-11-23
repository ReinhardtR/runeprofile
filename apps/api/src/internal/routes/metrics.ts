import { drizzle } from "@runeprofile/db";
import { FRONTPAGE_EVENT, isFrontpageEventLive } from "@runeprofile/runescape";

import { newRouter } from "~/lib/helpers";
import { edgeCache } from "~/lib/logging";
import {
  EventLeaderboards,
  eventLeaderboardsKvKey,
} from "~/lib/metrics/get-event-leaderboards";
import { getMetrics } from "~/lib/metrics/get-metrics";
import { STATUS } from "~/lib/status";

export const metricsRouter = newRouter()
  .get(
    "/",
    edgeCache({
      // Bumped when the row-count source changed from pg_stat_user_tables to
      // pg_class — a new namespace orphans the entries holding the old counts,
      // including the SSR one cached under the service-binding hostname.
      cacheName: "metrics-v2",
      cacheControl: "public, max-age=3600, stale-while-revalidate=300",
    }),
    async (c) => {
      const db = drizzle(c.env.HYPERDRIVE);

      const metrics = await getMetrics(db);

      return c.json(metrics, STATUS.OK);
    },
  )
  .get("/event-leaderboards", async (c) => {
    const empty: EventLeaderboards = { clog: [], purples: [] };

    if (!FRONTPAGE_EVENT || !isFrontpageEventLive(FRONTPAGE_EVENT)) {
      return c.json(empty, STATUS.OK);
    }

    // Filled by the */15 cron (refreshEventLeaderboards) — never computed per
    // request. Until the first run after launch the boards are empty, which
    // is also what they'd show minutes into an event anyway.
    const leaderboards = await c.env.KV.get<EventLeaderboards>(
      eventLeaderboardsKvKey(FRONTPAGE_EVENT),
      { type: "json", cacheTtl: 300 },
    );

    if (!leaderboards) {
      c.header("Cache-Control", "no-store");
      return c.json(empty, STATUS.OK);
    }

    c.header("Cache-Control", "public, max-age=300");
    return c.json(leaderboards, STATUS.OK);
  });
