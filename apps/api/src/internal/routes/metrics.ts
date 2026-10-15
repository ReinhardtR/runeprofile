import { drizzle } from "@runeprofile/db";
import { FRONTPAGE_EVENT, isFrontpageEventLive } from "@runeprofile/runescape";

import { newRouter } from "~/lib/helpers";
import { edgeCache } from "~/lib/logging";
import { getEventLeaderboards } from "~/lib/metrics/get-event-leaderboards";
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
  .get(
    "/event-leaderboards",
    edgeCache({
      // Namespaced by event and live state so the empty teaser response
      // cached before launch isn't served after the launch deploy.
      cacheName: `event-leaderboards-${FRONTPAGE_EVENT?.name}-${FRONTPAGE_EVENT && isFrontpageEventLive(FRONTPAGE_EVENT) ? "live" : "teaser"}`,
      cacheControl: "public, max-age=900",
    }),
    async (c) => {
      if (!FRONTPAGE_EVENT || !isFrontpageEventLive(FRONTPAGE_EVENT)) {
        return c.json({ clog: [], purples: [] }, STATUS.OK);
      }

      const db = drizzle(c.env.HYPERDRIVE);

      const leaderboards = await getEventLeaderboards(db, FRONTPAGE_EVENT);

      return c.json(leaderboards, STATUS.OK);
    },
  );
