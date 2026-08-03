import { cache } from "hono/cache";

import { drizzle } from "@runeprofile/db";

import { newRouter } from "~/lib/helpers";
import { getMetrics } from "~/lib/metrics/get-metrics";
import { STATUS } from "~/lib/status";

export const metricsRouter = newRouter().get(
  "/",
  cache({
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
);
