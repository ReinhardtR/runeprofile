import { getCloudflareContext } from "@opennextjs/cloudflare";

const DIFF_CACHE_PREFIX = "diff:";

/**
 * Invalidates the diff cache for an account in KV.
 * Call this from any admin action that mutates profile data
 * (items, quests, skills, diary tiers, combat achievement tiers, or account fields).
 */
export async function invalidateDiffCache(accountId: string): Promise<void> {
  try {
    const { env } = getCloudflareContext();
    await env.KV.delete(`${DIFF_CACHE_PREFIX}${accountId}`);
  } catch (error) {
    console.error("Failed to invalidate diff cache:", error);
  }
}
