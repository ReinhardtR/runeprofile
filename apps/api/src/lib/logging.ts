import type { Context } from "hono";
import { cache } from "hono/cache";
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
 * hono/cache with the outcome recorded on the wide event as `cache_status`:
 * on a hit the handler never runs and the response comes from the colo cache.
 */
export const edgeCache = (options: Parameters<typeof cache>[0]) => {
  const middleware = cache(options);
  return createMiddleware(async (c, next) => {
    let missed = false;
    await middleware(c, async () => {
      missed = true;
      await next();
    });
    logFields(c, { cache_status: missed ? "miss" : "hit" });
  });
};

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
    const cf = (c.req.raw as { cf?: { country?: string; colo?: string } }).cf;
    console.log({
      event: "http_request",
      method,
      path: new URL(c.req.url).pathname,
      route: routePath(c),
      status,
      duration_ms: durationMs,
      sample_rate: sampleRate,
      ray: c.req.header("cf-ray") ?? null,
      country: cf?.country ?? null,
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
