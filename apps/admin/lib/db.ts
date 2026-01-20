import { drizzle, type Database } from "@runeprofile/db";

// Use globalThis to persist across hot reloads in development
const globalForDb = globalThis as unknown as {
  db: Database | undefined;
};

function createDb(): Database {
  return drizzle(
    { connectionString: process.env.DATABASE_URL! },
    { logger: false },
    {
      idle_timeout: 20,
      max_lifetime: 60 * 30,
    },
  );
}

export const db: Database =
  globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
