import type { D1Database } from "@cloudflare/workers-types";
import { DrizzleConfig } from "drizzle-orm";
import { drizzle as initDrizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export const drizzle = (client: D1Database, opts: DrizzleConfig = {}) => {
  const { logger = true, casing = "snake_case" } = opts;
  return initDrizzle(client, { schema, logger, casing });
};

export type Database = ReturnType<typeof drizzle>;
