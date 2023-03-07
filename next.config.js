// @ts-check
const { withAxiom } = require("next-axiom");
const { env } = require("./src/env");

/**
 * Don't be scared of the generics here.
 * All they do is to give us autocompletion when using this.
 *
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function getConfig(config) {
  return config;
}

module.exports = withAxiom(
  getConfig({
    reactStrictMode: true,
    swcMinify: true,
    experimental: {
      appDir: true,
      typedRoutes: true,
      swcPlugins: [
        [
          "next-superjson-plugin",
          {
            excluded: [],
          },
        ],
      ],
    },
  })
);
