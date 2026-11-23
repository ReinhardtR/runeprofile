import { sql } from "drizzle-orm";

import { Database } from "@runeprofile/db";
import {
  AccountTypes,
  FrontpageEvent,
  isFrontpageEventLive,
} from "@runeprofile/runescape";

const LEADERBOARD_SIZE = 10;

// The frontpage reads leaderboards from KV; the cron keeps them fresh. Never
// compute them per request — on a small Postgres instance one run is several
// seconds of random heap reads, and the per-colo edge cache multiplied that
// into ~20% of all database time during The Fractured Archive.
export const EVENT_LEADERBOARDS_REFRESH_SECONDS = 15 * 60;

export function eventLeaderboardsKvKey(event: FrontpageEvent) {
  return `event-leaderboards:${event.name}`;
}

export type EventLeaderboardEntry = {
  username: string;
  accountType: (typeof AccountTypes)[number];
  obtained: number;
  quantity: number;
  items: { id: number; quantity: number }[];
};

export type EventLeaderboards = {
  clog: EventLeaderboardEntry[];
  purples: EventLeaderboardEntry[];
};

type Row = {
  board: "clog" | "purples";
  username: string;
  account_type: number;
  obtained: number;
  quantity: number;
  items: { id: number; quantity: number }[];
};

// Both boards in one statement: the event items are read once into a
// materialized per-account aggregate, then each board takes its own top N.
// The Collection Log board ranks by unique clog items obtained, Purples by the
// summed quantity of purples. Ties go to whoever got their latest new board
// item first — items.created_at survives quantity upserts, so it marks when an
// item was first logged.
export async function getEventLeaderboards(
  db: Database,
  event: FrontpageEvent,
): Promise<EventLeaderboards> {
  const clogIds = event.clogItemIds;
  const purpleIds = event.purpleItemIds;
  const allIds = [...new Set([...clogIds, ...purpleIds])];

  if (allIds.length === 0) return { clog: [], purples: [] };

  const clogArr = sql`${`{${clogIds.join(",")}}`}::int[]`;
  const purpleArr = sql`${`{${purpleIds.join(",")}}`}::int[]`;
  const allArr = sql`${`{${allIds.join(",")}}`}::int[]`;

  const result = await db.execute(sql`
    with per_account as materialized (
      select
        i.account_id,
        (count(*) filter (where i.id = any(${clogArr})))::int as obtained,
        max(i.created_at) filter (where i.id = any(${clogArr})) as clog_last,
        coalesce(sum(i.quantity) filter (where i.id = any(${purpleArr})), 0)::int as quantity,
        max(i.created_at) filter (where i.id = any(${purpleArr})) as purple_last,
        json_agg(json_build_object('id', i.id, 'quantity', i.quantity)) as items
      from items i
      where i.id = any(${allArr}) and i.quantity > 0
      group by i.account_id
    )
    (
      select 'clog' as board, a.username, a.account_type, p.obtained, p.quantity, p.items
      from per_account p
      join accounts a on a.id = p.account_id
      where p.obtained > 0 and a.banned = false
      order by p.obtained desc, p.clog_last asc, a.username asc
      limit ${LEADERBOARD_SIZE}
    )
    union all
    (
      select 'purples' as board, a.username, a.account_type, p.obtained, p.quantity, p.items
      from per_account p
      join accounts a on a.id = p.account_id
      where p.quantity > 0 and a.banned = false
      order by p.quantity desc, p.purple_last asc, a.username asc
      limit ${LEADERBOARD_SIZE}
    )
  `);

  // postgres-js returns the rows directly, pglite (tests) wraps them.
  const rows = (
    Array.isArray(result) ? result : (result as { rows: unknown[] }).rows
  ) as Row[];

  const toEntry = (row: Row, itemIds: number[]): EventLeaderboardEntry => ({
    username: row.username,
    accountType:
      AccountTypes.find((type) => type.id === row.account_type) ||
      AccountTypes[0],
    obtained: row.obtained,
    quantity: row.quantity,
    // json_agg has no order and spans both boards' items; return just this
    // board's items, in the event's display order.
    items: row.items
      .filter((item) => itemIds.includes(item.id))
      .sort((a, b) => itemIds.indexOf(a.id) - itemIds.indexOf(b.id)),
  });

  // union all doesn't guarantee each branch's order survives; re-sort.
  const board = (name: Row["board"], itemIds: number[]) =>
    rows.filter((row) => row.board === name).map((row) => toEntry(row, itemIds));

  return {
    clog: sortEntries(board("clog", clogIds), "obtained"),
    purples: sortEntries(board("purples", purpleIds), "quantity"),
  };
}

// Stable sort by the board's primary metric only — the SQL already applied the
// tie-breakers, and a stable sort keeps them.
function sortEntries(
  entries: EventLeaderboardEntry[],
  by: "obtained" | "quantity",
) {
  return entries.sort((a, b) => b[by] - a[by]);
}

// Run by the cron. Writes the boards to KV so requests never hit Postgres.
export async function refreshEventLeaderboards(
  db: Database,
  kv: KVNamespace,
  event: FrontpageEvent | null,
) {
  if (!event || !isFrontpageEventLive(event)) return;

  const leaderboards = await getEventLeaderboards(db, event);

  await kv.put(eventLeaderboardsKvKey(event), JSON.stringify(leaderboards), {
    // Outlives a couple of missed cron runs, but not a finished event.
    expirationTtl: EVENT_LEADERBOARDS_REFRESH_SECONDS * 4,
  });
}
