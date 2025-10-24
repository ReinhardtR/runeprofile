import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

initOpenNextCloudflareForDev({
  experimental: {
    remoteBindings: true,
  },
});
