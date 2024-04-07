// import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "libsql-stateless-easy";

import { env } from "~/env.mjs";

import * as schema from "./schema";

const client = createClient({
  url: env.TURSO_CONNECTION_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, {
  schema,
  logger: true,
});
