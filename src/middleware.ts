import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "~/env.mjs";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "5 s"),
});

export default async function middleware(
  request: NextRequest
): Promise<Response | undefined> {
  const url = request.nextUrl.clone();

  // allow static assets to be served
  if (url.pathname.startsWith("/_next/static/")) {
    return NextResponse.next();
  }

  // rate limit API routes
  if (url.pathname.startsWith("/api/")) {
    const ip = request.ip ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return new Response("Rate limit exceeded", { status: 429 });
    }

    return NextResponse.next();
  }

  const lowerPathname = url.pathname.toLowerCase();
  if (url.pathname !== lowerPathname) {
    url.pathname = lowerPathname;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
