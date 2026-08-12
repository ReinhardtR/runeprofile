/**
 * Purging a player's cached OG image.
 *
 * The OG route caches its render for a day, which is what keeps it cheap —
 * a profile's stats being a day stale is fine, but a player who has just
 * changed how their character looks should see that straight away.
 *
 * This goes through the zone purge API rather than deleting from the Cache
 * API inside a Worker. The Cache API is bound to the data centre the Worker
 * is running in, and the web Worker (which owns the OG route) has no
 * placement region, so it runs wherever the visitor is: a delete would
 * clear one data centre and leave the image cached in every other one. The
 * zone purge is global.
 */

const PURGE_ENDPOINT = "https://api.cloudflare.com/client/v4/zones";
const SITE_ORIGIN = "https://runeprofile.com";

type PurgeEnv = {
  CLOUDFLARE_ZONE_ID: string;
  CLOUDFLARE_API_TOKEN: string;
};

/**
 * Drops a player's OG image from the edge cache. Never throws: a failed
 * purge means a stale image for up to a day, which is not worth failing an
 * upload over.
 */
export async function purgeOgImage(
  env: Partial<PurgeEnv>,
  username: string,
): Promise<void> {
  const zone = env.CLOUDFLARE_ZONE_ID;
  const token = env.CLOUDFLARE_API_TOKEN;
  if (!zone || !token) {
    // Expected locally, where there is no edge cache to purge.
    console.log("Skipping OG purge: no zone id or api token configured");
    return;
  }

  const name = encodeURIComponent(username);
  // Both spellings the route answers on, since either could have been the
  // one a crawler fetched and cached.
  const files = [`${SITE_ORIGIN}/og/${name}.png`, `${SITE_ORIGIN}/og/${name}`];

  try {
    const response = await fetch(`${PURGE_ENDPOINT}/${zone}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files }),
    });
    if (!response.ok) {
      console.error(
        `OG purge failed for ${username} (${response.status}): ${await response.text()}`,
      );
      return;
    }
    console.log(`Purged OG image for ${username}`);
  } catch (error) {
    console.error(`OG purge failed for ${username}:`, error);
  }
}
