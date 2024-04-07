import "./src/env.mjs";

import withMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  experimental: {
    typedRoutes: true,
  },
  sentry: {
    hideSourceMaps: true,
  },
};

/** @type {Partial<import("@sentry/nextjs").SentryWebpackPluginOptions>} */
const sentryConfig = {
  org: "runeprofile",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
};

export default withMDX()(withSentryConfig(nextConfig, sentryConfig));
