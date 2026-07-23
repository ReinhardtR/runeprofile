// Minimal typing for the Worker env — the full `wrangler types` output
// redeclares fetch globals that conflict with lib.dom in this app.
declare module "cloudflare:workers" {
  export const env: {
    /** Service binding to the runeprofile-api worker. */
    API: { fetch: (request: Request) => Promise<Response> };
  };
}
