import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { drizzle } from "@runeprofile/db";

import { STATUS } from "~/lib/status";

export type ApiKeyContext = {
  Variables: {
    apiKey: { id: string; name: string; tier: string } | null;
  };
};

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const apiKeyMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: ApiKeyContext["Variables"];
}>(async (c, next) => {
  const key = c.req.header("X-API-Key");

  if (!key) {
    c.set("apiKey", null);
    return next();
  }

  const keyHash = await hashKey(key);

  // Check KV cache first
  const cacheKey = `api_key:${keyHash}`;
  const cached = await c.env.KV.get(cacheKey, "json");
  if (cached) {
    c.set("apiKey", cached as { id: string; name: string; tier: string });
    return next();
  }

  const db = drizzle(c.env.HYPERDRIVE);
  const result = await db.query.apiKeys.findFirst({
    where: (table) => eq(table.keyHash, keyHash),
    columns: {
      id: true,
      name: true,
      tier: true,
      active: true,
    },
  });

  if (!result || !result.active) {
    return c.json(
      { error: "Invalid or inactive API key", code: "UNAUTHORIZED" },
      STATUS.UNAUTHORIZED,
    );
  }

  const apiKeyData = { id: result.id, name: result.name, tier: result.tier };

  // Cache for 5 minutes
  await c.env.KV.put(cacheKey, JSON.stringify(apiKeyData), {
    expirationTtl: 300,
  });

  c.set("apiKey", apiKeyData);
  return next();
});
