import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

// Only needed for `next dev`; during `next build` it would spin up a remote
// bindings proxy (KV/R2 are `remote: true`) and require a wrangler login.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.runelite.net",
        port: "",
        pathname: "/cache/item/icon/**",
      },
    ],
  },
};

export default nextConfig;
