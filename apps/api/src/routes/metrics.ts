import { and, desc, eq, inArray, sum } from "drizzle-orm";
import { cache } from "hono/cache";

import { accounts, drizzle, items } from "~/db";
import { newRouter } from "~/lib/helpers";
import { getMetrics } from "~/lib/metrics/get-metrics";
import { STATUS } from "~/lib/status";

const EVENT_ITEM_IDS: number[] = [];

export const metricsRouter = newRouter()
  .get(
    "/",
    cache({
      cacheName: "metrics",
      cacheControl: "public, max-age=86400, stale-while-revalidate=300",
    }),
    async (c) => {
      const db = drizzle(c.env.DB);

      const metrics = await getMetrics(db);

      return c.json(metrics, STATUS.OK);
    },
  )
  .get(
    "/event-leaderboard",
    cache({ cacheName: "event-leaderboard", cacheControl: "max-age=1800" }),
    async (c) => {
      const db = drizzle(c.env.DB);

      const rankedAccountsCTE = db.$with("ranked_accounts").as(
        db
          .select({
            accountId: items.accountId,
            totalQuantity: sum(items.quantity)
              .mapWith(Number)
              .as("total_quantity"),
          })
          .from(items)
          .where(inArray(items.id, EVENT_ITEM_IDS))
          .groupBy(items.accountId)
          .orderBy(desc(sum(items.quantity).mapWith(Number)))
          .limit(10),
      );

      const orderedRows = await db
        .with(rankedAccountsCTE)
        .select({
          username: accounts.username,
          accountId: accounts.id,
          itemId: items.id,
          itemQuantity: items.quantity,
          totalRankedQuantity: rankedAccountsCTE.totalQuantity,
        })
        .from(rankedAccountsCTE)
        .innerJoin(accounts, eq(accounts.id, rankedAccountsCTE.accountId))
        .innerJoin(
          items,
          and(
            eq(items.accountId, rankedAccountsCTE.accountId),
            inArray(items.id, EVENT_ITEM_IDS),
          ),
        )
        .orderBy(
          desc(rankedAccountsCTE.totalQuantity),
          rankedAccountsCTE.accountId,
          items.id,
        );

      const result: {
        username: string;
        items: { id: number; quantity: number }[];
      }[] = [];
      let currentAccountId: string | null = null;
      let currentAccountData: {
        username: string;
        items: { id: number; quantity: number }[];
      } | null = null;

      for (const row of orderedRows) {
        if (currentAccountId !== row.accountId) {
          // This is a new account in the ordered list
          if (currentAccountData) {
            result.push(currentAccountData);
          }
          currentAccountId = row.accountId;
          currentAccountData = {
            username: row.username,
            items: [],
          };
        }

        if (
          currentAccountData &&
          row.itemId !== null &&
          row.itemQuantity !== null
        ) {
          currentAccountData.items.push({
            id: row.itemId,
            quantity: row.itemQuantity,
          });
        }
      }

      if (currentAccountData) {
        result.push(currentAccountData);
      }

      return c.json(result, STATUS.OK);
    },
  );
