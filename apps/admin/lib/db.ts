import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

import { drizzle } from "@runeprofile/db";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(env.DB);
});
