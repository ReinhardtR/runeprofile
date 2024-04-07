import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import { env } from "~/env.mjs";

const client = createClient({
  url: env.TURSO_CONNECTION_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

const runMigrate = async () => {
  await migrate(db, { migrationsFolder: ".drizzle" });
};

runMigrate();
