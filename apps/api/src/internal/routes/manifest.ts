import { newRouter } from "~/lib/helpers";
import { getManifest } from "~/lib/manifest/get-manifest";
import { STATUS } from "~/lib/status";

export const manifestRouter = newRouter().get("/", async (c) => {
  const manifest = getManifest();
  // The manifest is built from in-memory constants, so edge caching buys
  // nothing (and made shipping data updates painful: hono's cache middleware
  // handed clients a 24h max-age that RuneLite's persistent OkHttp cache
  // honors across restarts). Keep the client TTL short instead.
  c.header("Cache-Control", "public, max-age=300");
  return c.json(manifest, STATUS.OK);
});
