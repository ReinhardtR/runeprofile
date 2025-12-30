import { DrizzleConfig } from "drizzle-orm";
import { drizzle as initDrizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export const drizzle = (
  database: { connectionString: string },
  opts: DrizzleConfig = {},
) => {
  const { logger = true, casing = "snake_case" } = opts;

  const sql = postgres(database.connectionString, {
    max: 5,
    fetch_types: false,
  });

  return initDrizzle(sql, { schema, logger, casing });
};

export type Database = ReturnType<typeof drizzle>;
