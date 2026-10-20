import { and, asc, desc, eq, gt, inArray, max, sql } from "drizzle-orm";

import { Database, accounts, items } from "@runeprofile/db";
import { AccountTypes, FrontpageEvent } from "@runeprofile/runescape";

const LEADERBOARD_SIZE = 10;

export async function getEventLeaderboards(
  db: Database,
  event: FrontpageEvent,
) {
  const [clog, purples] = await Promise.all([
    getEventLeaderboard(db, event.clogItemIds, "obtained"),
    getEventLeaderboard(db, event.purpleItemIds, "quantity"),
  ]);

  return { clog, purples };
}

// Ranks accounts by how many of the item ids they've obtained, or by the
// summed quantity of them. Ties go to whoever got their latest new item
// first — items.created_at survives quantity upserts, so it marks when an
// item was first logged.
export async function getEventLeaderboard(
  db: Database,
  itemIds: number[],
  rankBy: "obtained" | "quantity",
) {
  if (itemIds.length === 0) return [];

  const obtained = sql<number>`count(*)::int`;
  const quantity = sql<number>`sum(${items.quantity})::int`;

  const rows = await db
    .select({
      username: accounts.username,
      accountType: accounts.accountType,
      obtained,
      quantity,
      items: sql<
        { id: number; quantity: number }[]
      >`json_agg(json_build_object('id', ${items.id}, 'quantity', ${items.quantity}))`,
    })
    .from(items)
    .innerJoin(accounts, eq(accounts.id, items.accountId))
    .where(
      and(
        inArray(items.id, itemIds),
        gt(items.quantity, 0),
        eq(accounts.banned, false),
      ),
    )
    .groupBy(accounts.id)
    .orderBy(
      desc(rankBy === "obtained" ? obtained : quantity),
      asc(max(items.createdAt)),
      asc(accounts.username),
    )
    .limit(LEADERBOARD_SIZE);

  return rows.map((row) => ({
    username: row.username,
    accountType:
      AccountTypes.find((type) => type.id === row.accountType) ||
      AccountTypes[0],
    obtained: row.obtained,
    quantity: row.quantity,
    // json_agg has no order; return items in the event's display order.
    items: row.items.sort(
      (a, b) => itemIds.indexOf(a.id) - itemIds.indexOf(b.id),
    ),
  }));
}
