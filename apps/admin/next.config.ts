import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

initOpenNextCloudflareForDev();

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
