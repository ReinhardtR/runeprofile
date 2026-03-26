import { sql } from "drizzle-orm";

import { Database } from "@runeprofile/db";

export async function getMetrics(db: Database) {
  const [accountsResult, activitiesResult] = await Promise.all([
    db.execute(
      sql`select n_live_tup::bigint as estimate
          from pg_stat_user_tables
          where schemaname = current_schema() and relname = 'accounts'`,
    ),
    db.execute(
      sql`select n_live_tup::bigint as estimate
          from pg_stat_user_tables
          where schemaname = current_schema() and relname = 'activities'`,
    ),
  ]);

  const totalAccounts = Number(accountsResult[0]?.estimate ?? 0);
  const totalActivities = Number(activitiesResult[0]?.estimate ?? 0);

  return {
    totalAccounts,
    totalActivities,
  };
}
