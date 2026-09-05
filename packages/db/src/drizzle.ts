import { DrizzleConfig } from "drizzle-orm";
import { drizzle as initDrizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export const drizzle = (
  database: { connectionString: string },
  opts: DrizzleConfig = {},
  pgOpts: postgres.Options<any> = {},
) => {
  // SQL logging is opt-in: with logger on by default every production query
  // was written to Workers Logs (millions of log lines per day).
  const { logger = false, casing = "snake_case" } = opts;

  const sql = postgres(database.connectionString, {
    max: 5,
    fetch_types: false,
    ...pgOpts,
  });

  return initDrizzle(sql, { schema, logger, casing });
};

export type Database = ReturnType<typeof drizzle>;
