import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";

import { InvalidCursorError } from "~/lib/helpers";
import { STATUS } from "~/lib/status";

import { createV1App } from "./app";
import type { V1Env } from "./app";
import { apiKeyMiddleware } from "./middleware/api-key";
import { v1RateLimiter } from "./middleware/rate-limit";
import { accountsRouter, fullProfileRouter } from "./routes/accounts";
import { activitiesRouter } from "./routes/activities";
import { clansRouter } from "./routes/clans";
import {
  collectionLogPageRouter,
  collectionLogRouter,
  collectionLogTabRouter,
} from "./routes/collection-log";

const v1 = createV1App();

// --- Middleware ---
v1.use("*", cors({ origin: "*" }));
v1.use("*", apiKeyMiddleware);
v1.use("/accounts/*", v1RateLimiter);
v1.use("/clans/*", v1RateLimiter);

// --- Mount routes ---
v1.route("/", accountsRouter);
v1.route("/", collectionLogRouter);
v1.route("/", collectionLogTabRouter);
v1.route("/", collectionLogPageRouter);
v1.route("/", activitiesRouter);
v1.route("/", fullProfileRouter);
v1.route("/", clansRouter);

// --- OpenAPI spec ---
v1.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "RuneProfile Public API",
    version: "1.0.0",
    description: `Public API for accessing Old School RuneScape player data tracked by RuneProfile. Provides granular, read-only endpoints for account stats, collection logs, quests, achievements, and activity feeds.

## Rate Limiting

All API routes are rate-limited. The limits depend on whether you provide an API key:

| Tier | Limit |
|------|-------|
| Anonymous | 30 requests / minute |
| Authenticated | 120 requests / minute |
| Partner | 600 requests / minute |

When the limit is exceeded, the API returns a \`429 Too Many Requests\` response.

All responses are cached for 1 minute, so repeated requests for the same resource will return identical data. There is no benefit to polling more frequently than once per minute.

## Authentication

Pass your API key via the \`X-API-Key\` header. Keys are optional — all endpoints work without one, just at a lower rate limit. Join the Discord to request an API key or inquire about partner access.

## User-Agent

Please set a descriptive \`User-Agent\` header so we can reach out if there's an issue with your integration. A Discord username works great:

\`\`\`
User-Agent: my-cool-app (@yourdiscord)
\`\`\`

## Support

Join the [RuneProfile Discord](https://discord.com/invite/6XgBcePAfj) for API support, to request an API key, or to report issues.`,
    contact: {
      name: "RuneProfile",
      url: "https://runeprofile.com",
    },
  },
  servers: [
    {
      url: "https://api.runeprofile.com/v1",
      description: "Production",
    },
  ],
  security: [{} as Record<string, string[]>, { apiKey: [] }],
});

// Register the API key security scheme
v1.openAPIRegistry.registerComponent("securitySchemes", "apiKey", {
  type: "apiKey",
  in: "header",
  name: "X-API-Key",
  description:
    "Optional API key. Without a key, requests are rate-limited to 30/min per IP. With a standard key, the limit is 120/min. Partner keys allow 600/min.",
});

// --- Scalar docs ---
v1.get(
  "/docs",
  Scalar<V1Env>((c) => {
    return {
      pageTitle: "RuneProfile API",
      url: "/v1/openapi.json",
      favicon: "https://runeprofile.com/favicon.ico",
      servers: [
        {
          url: "https://api.runeprofile.com/v1",
          description: "Production",
        },
        {
          url: "http://localhost:8787/v1",
          description: "Local development",
        },
      ],
      hideClientButton: true,
      integration: null,
      authentication: {
        preferredSecurityScheme: "apiKey",
      },
      agent: {
        disabled: true,
      },
      mcp: {
        disabled: true,
      },
      forceDarkModeState: "dark",
      theme: "default",
    };
  }),
);

// --- Error handling ---
v1.onError((err, c) => {
  if (err instanceof InvalidCursorError) {
    return c.json(
      { error: "Invalid cursor", code: "BAD_REQUEST" },
      STATUS.BAD_REQUEST,
    );
  }
  console.error(err);
  return c.json(
    { error: "Something unexpected went wrong", code: "INTERNAL_ERROR" },
    STATUS.INTERNAL_SERVER_ERROR,
  );
});

v1.notFound((c) => {
  return c.json({ error: "Not found", code: "NOT_FOUND" }, STATUS.NOT_FOUND);
});

export { v1 };
