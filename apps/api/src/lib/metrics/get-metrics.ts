import { sql } from "drizzle-orm";

import { Database } from "@runeprofile/db";

export async function getMetrics(db: Database) {
  // reltuples lives in the catalog and is kept up to date by vacuum/analyze, so
  // it survives a stats-collector reset — unlike pg_stat_user_tables.n_live_tup,
  // which only counts rows written since the reset.
  const result = await db.execute(
    sql`select c.relname, greatest(c.reltuples, 0)::bigint as estimate
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = current_schema() and c.relname in ('accounts', 'activities')`,
  );

  const totalAccounts = Number(
    result.find((r) => r.relname === "accounts")?.estimate ?? 0,
  );
  const totalActivities = Number(
    result.find((r) => r.relname === "activities")?.estimate ?? 0,
  );

  return {
    totalAccounts,
    totalActivities,
  };
}
