import { NextResponse, type NextRequest } from "next/server";

import { verifyAccessRequest } from "@/lib/access";

export async function middleware(request: NextRequest) {
  try {
    await verifyAccessRequest(request.headers);
  } catch {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export const config = {
  // Only exclude immutable hashed assets (served by the ASSETS binding before
  // the worker runs anyway). Everything that executes code — pages, server
  // actions, /_next/image — goes through verification.
  matcher: ["/((?!_next/static).*)"],
};
