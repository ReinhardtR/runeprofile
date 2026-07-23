import { cache } from "hono/cache";

import { newRouter } from "~/lib/helpers";
import { getManifest } from "~/lib/manifest/get-manifest";
import { STATUS } from "~/lib/status";

export const manifestRouter = newRouter().get(
  "/",
  cache({
    // Bump the suffix to invalidate the edge cache immediately (there is no
    // way to purge a named cache across colos on deploy).
    cacheName: "manifest-v2",
    cacheControl: "max-age=86400", // 24 hours
  }),
  async (c) => {
    const manifest = getManifest();
    return c.json(manifest, STATUS.OK);
  },
);
