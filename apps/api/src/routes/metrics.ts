import { cache } from "hono/cache";

import { drizzle } from "@runeprofile/db";

import { newRouter } from "~/lib/helpers";
import { getMetrics } from "~/lib/metrics/get-metrics";
import { STATUS } from "~/lib/status";

export const metricsRouter = newRouter().get(
  "/",
  cache({
    cacheName: "metrics",
    cacheControl: "public, max-age=86400, stale-while-revalidate=300",
  }),
  async (c) => {
    const db = drizzle(c.env.HYPERDRIVE);

    const metrics = await getMetrics(db);

    return c.json(metrics, STATUS.OK);
  },
);
