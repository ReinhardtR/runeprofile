import { drizzle as initDrizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export const drizzle = (client: D1Database) => {
  return initDrizzle(client, { schema, casing: "snake_case", logger: true });
};

export type Database = ReturnType<typeof drizzle>;

export * from "./schema";
