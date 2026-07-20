import { getCloudflareContext } from "@opennextjs/cloudflare";

import { type Database, drizzle } from "@runeprofile/db";

// Workers cannot share I/O objects (sockets) across requests, so when running
// on Cloudflare a client is created per request — cheap, since Hyperdrive does
// the real connection pooling — and cached on the request's ExecutionContext.
// Outside a worker (local `next dev` without bindings, `next build`) a global
// singleton on DATABASE_URL is used instead.

const perRequestDb = new WeakMap<object, Database>();

const globalForDb = globalThis as unknown as {
  db: Database | undefined;
};

function createDb(connectionString: string): Database {
  return drizzle(
    { connectionString },
    { logger: false },
    {
      idle_timeout: 20,
      max_lifetime: 60 * 30,
    },
  );
}

function resolveDb(): Database {
  let cf: ReturnType<typeof getCloudflareContext> | undefined;
  try {
    cf = getCloudflareContext();
  } catch {
    // Not running inside a worker context.
  }

  const connectionString = cf?.env.HYPERDRIVE?.connectionString;
  if (cf && connectionString) {
    const key = cf.ctx as unknown as object;
    let instance = perRequestDb.get(key);
    if (!instance) {
      instance = createDb(connectionString);
      perRequestDb.set(key, instance);
    }
    return instance;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("No HYPERDRIVE binding and no DATABASE_URL set");
  }
  globalForDb.db ??= createDb(process.env.DATABASE_URL);
  return globalForDb.db;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = resolveDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
