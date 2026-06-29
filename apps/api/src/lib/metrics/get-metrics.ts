import { sql } from "drizzle-orm";

import { Database } from "@runeprofile/db";

export async function getMetrics(db: Database) {
  const result = await db.execute(
    sql`select relname, n_live_tup::bigint as estimate
        from pg_stat_user_tables
        where schemaname = current_schema() and relname in ('accounts', 'activities')`,
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
