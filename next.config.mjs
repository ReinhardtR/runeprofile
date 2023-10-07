import "./src/env.mjs";

// TODO: add axiom
/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default config;
