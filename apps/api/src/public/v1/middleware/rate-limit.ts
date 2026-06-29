import { rateLimiter } from "hono-rate-limiter";

import type { ApiKeyContext } from "./api-key";

export const v1RateLimiter = rateLimiter<{
  Bindings: Env;
  Variables: ApiKeyContext["Variables"];
}>({
  binding: (c) => {
    const apiKey = c.get("apiKey");
    if (!apiKey) return c.env.V1_RATE_LIMIT;
    if (apiKey.tier === "partner") return c.env.V1_RATE_LIMIT_PARTNER;
    return c.env.V1_RATE_LIMIT_KEYED;
  },
  keyGenerator: (c) => {
    const apiKey = c.get("apiKey");
    if (apiKey) {
      return apiKey.id;
    }
    return (
      c.req.header("cf-connecting-ip") ??
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      ""
    );
  },
  message: { error: "Too many requests", code: "RATE_LIMIT_EXCEEDED" },
  statusCode: 429,
});
