import { cache } from "hono/cache";

import { newRouter } from "~/lib/helpers";
import { getManifest } from "~/lib/manifest/get-manifest";
import { STATUS } from "~/lib/status";

export const manifestRouter = newRouter().get(
  "/",
  cache({
    cacheName: "manifest",
    cacheControl: "max-age=86400", // 24 hours
  }),
  async (c) => {
    const manifest = getManifest();
    return c.json(manifest, STATUS.OK);
  },
);
