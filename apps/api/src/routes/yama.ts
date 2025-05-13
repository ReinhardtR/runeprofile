import { desc, eq, inArray, sql } from "drizzle-orm";

import { accounts, drizzle, items } from "~/db";
import { newRouter } from "~/lib/helpers";
import { STATUS } from "~/lib/status";

const YAMA_ITEM_IDS = [27277, 20997, 22486];

export const yamaRouter = newRouter().get("/leaderboard", async (c) => {
  const db = drizzle(c.env.DB);

  const topPlayersCTE = db.$with("top_players").as(
    db
      .select({
        accountId: accounts.id,
        username: accounts.username,
        // Calculate the total quantity of specified items for ranking
        totalQuantity: sql<number>`sum(${items.quantity})`.as(
          "total_quantity_for_ranking",
        ),
      })
      .from(accounts)
      .innerJoin(items, sql`${accounts.id} = ${items.accountId}`)

      .groupBy(accounts.id, accounts.username)
      .orderBy(sql`total_quantity_for_ranking DESC`)
      .limit(10),
  );

  const queryResult = await db
    .with(topPlayersCTE)
    .select({
      username: topPlayersCTE.username,
      itemId: items.id,
      quantity: items.quantity,
    })
    .from(topPlayersCTE)
    .innerJoin(items, sql`${topPlayersCTE.accountId} = ${items.accountId}`)
    .where(sql`${items.id} IN ${YAMA_ITEM_IDS}`)
    .orderBy(topPlayersCTE.username, items.id);

  const result: {
    username: string;
    items: [{ id: number; quantity: number }];
  }[] = [];

  for (const row of queryResult) {
    const existingPlayer = result.find(
      (player) => player.username === row.username,
    );

    if (existingPlayer) {
      existingPlayer.items.push({
        id: row.itemId,
        quantity: row.quantity,
      });
    } else {
      result.push({
        username: row.username,
        items: [
          {
            id: row.itemId,
            quantity: row.quantity,
          },
        ],
      });
    }
  }

  return c.json(result, STATUS.OK);
});
