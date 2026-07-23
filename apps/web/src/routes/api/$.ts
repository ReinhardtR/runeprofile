import { createFileRoute } from "@tanstack/react-router";

import { getWorkerEnv } from "~/core/worker-env";

// Same-origin proxy for browser API calls: /api/* is forwarded to the API
// worker over the service binding, so the public api.runeprofile.com surface
// (and CORS) isn't needed for the web app.
async function proxyToApi({ request }: { request: Request }) {
  const env = await getWorkerEnv();
  const url = new URL(request.url);
  const target = new URL(
    url.pathname.replace(/^\/api/, "") + url.search,
    // The binding routes by request, not by hostname — this origin is only
    // needed to construct an absolute URL.
    "https://runeprofile-api.internal",
  );
  return env.API.fetch(new Request(target, request));
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: proxyToApi,
      POST: proxyToApi,
      DELETE: proxyToApi,
      OPTIONS: proxyToApi,
    },
  },
});
