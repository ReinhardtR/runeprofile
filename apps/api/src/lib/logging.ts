import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { routePath } from "hono/route";

import { RuneProfileError } from "~/lib/errors";

/**
 * Wide-event logging ("canonical log lines"): instead of scattering
 * console.logs through the request lifecycle, every request emits exactly one
 * structured event containing the full request context. Handlers enrich the
 * event with business fields via logFields(). Workers Logs indexes the JSON
 * keys, so events are queryable by any field.
 */
export type WideEvent = Record<string, unknown>;

declare module "hono" {
  interface ContextVariableMap {
    wideEvent: WideEvent;
  }
}

/** Attach business context to the current request's wide event. */
export const logFields = (c: Context, fields: WideEvent) => {
  const event = c.get("wideEvent");
  if (event) Object.assign(event, fields);
};

/**
 * Edge caching with the outcome recorded on the wide event as `cache_status`.
 *
 * Not hono/cache: on custom domains the Cache API operates on the zone cache,
 * where match() honours the client's conditional headers (If-Modified-Since /
 * If-None-Match) and can return a bodyless 304 whose internals break when
 * passed through Hono's response handling as-is — hono/cache 500'd on every
 * plugin revalidation poll. This implementation rebuilds cached responses
 * with fresh headers and is fail-open: any cache error falls through to the
 * origin handler instead of failing the request.
 */
export const edgeCache = (options: {
  cacheName: string;
  cacheControl?: string;
}) =>
  createMiddleware(async (c, next) => {
    if (c.req.method !== "GET" || !globalThis.caches) {
      await next();
      return;
    }

    let store: Cache | undefined;
    let cached: Response | undefined;
    try {
      store = await caches.open(options.cacheName);
      cached = await store.match(c.req.url);
    } catch (error) {
      console.error("Edge cache lookup failed:", error);
    }

    if (cached) {
      try {
        const headers = new Headers(cached.headers);
        const response =
          cached.status === 304
            ? new Response(null, { status: 304, headers })
            : new Response(cached.body, { status: cached.status, headers });
        logFields(c, {
          cache_status: cached.status === 304 ? "revalidated" : "hit",
        });
        return response;
      } catch (error) {
        console.error("Serving from edge cache failed:", error);
        // fall through to the origin handler
      }
    }

    logFields(c, { cache_status: "miss" });
    await next();

    if (!store || c.res.status !== 200) return;
    if (options.cacheControl && !c.res.headers.has("Cache-Control")) {
      c.res.headers.set("Cache-Control", options.cacheControl);
    }
    const toStore = c.res.clone();
    c.executionCtx.waitUntil(
      store.put(c.req.url, toStore).catch((error) => {
        console.error("Edge cache write failed:", error);
      }),
    );
  });

// Tail sampling: always keep errors, slow requests, and writes; keep a small
// sample of the huge volume of fast successful reads (plugin polling alone is
// millions of requests per day).
const FAST_READ_SAMPLE_RATE = 0.05;
const SLOW_THRESHOLD_MS = 1000;

export const wideEventLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const fields: WideEvent = {};
  c.set("wideEvent", fields);

  let error: unknown;
  try {
    await next();
  } catch (err) {
    error = err;
  }

  const durationMs = Date.now() - start;
  const method = c.req.method;
  let status = c.res?.status ?? 0;
  if (error) {
    status = error instanceof RuneProfileError ? error.status : 500;
  }

  const isError = status >= 400 || error !== undefined;
  const isSlow = durationMs >= SLOW_THRESHOLD_MS;
  const isWrite = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
  const sampleRate = isError || isSlow || isWrite ? 1 : FAST_READ_SAMPLE_RATE;

  if (sampleRate === 1 || Math.random() < sampleRate) {
    // Only infrastructure-side context is logged: colo is the Cloudflare
    // datacenter that served the request (edge caches are per-colo).
    // Deliberately no user-location fields (country, IP).
    const cf = (c.req.raw as { cf?: { colo?: string } }).cf;
    console.log({
      event: "http_request",
      method,
      path: new URL(c.req.url).pathname,
      route: routePath(c),
      status,
      duration_ms: durationMs,
      sample_rate: sampleRate,
      ray: c.req.header("cf-ray") ?? null,
      colo: cf?.colo ?? null,
      user_agent: c.req.header("user-agent") ?? null,
      ...(error !== undefined && {
        error_name: error instanceof Error ? error.name : "unknown",
        error_message: error instanceof Error ? error.message : String(error),
      }),
      ...fields,
    });
  }

  if (error !== undefined) throw error;
});
