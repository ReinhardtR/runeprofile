import { headers } from "next/headers";

import { verifyAccessRequest } from "@/lib/access";

/**
 * Server-action guard. Every exported server action must call this first —
 * it re-verifies the Cloudflare Access JWT independently of the middleware,
 * so actions stay protected even if the middleware layer is ever bypassed.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  return verifyAccessRequest(await headers());
}
