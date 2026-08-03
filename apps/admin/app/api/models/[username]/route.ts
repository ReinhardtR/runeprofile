import { verifyAccessRequest } from "@/lib/access";
import { createPetModelKey, createPlayerModelKey } from "@/lib/model-keys";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Serves a player's model straight out of R2.
 *
 * Admin reads the bucket directly rather than going through the public API, so
 * this works against whatever is stored right now - including profiles whose
 * plugin has not been updated yet, and models the website could not render.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  await verifyAccessRequest(request.headers);

  const { username } = await params;
  const pet = new URL(request.url).searchParams.has("pet");
  const key = pet
    ? createPetModelKey(username)
    : createPlayerModelKey(username);

  // The async form, because `initOpenNextCloudflareForDev` is not awaited in
  // next.config and a route handler can otherwise run before it resolves.
  const { env } = await getCloudflareContext({ async: true });
  const object = await env.BUCKET.get(key);
  if (!object) {
    return new Response(null, { status: pet ? 204 : 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type":
        object.httpMetadata?.contentType ?? "application/octet-stream",
      // Admin looks at models while they change, so never serve a stale one.
      "Cache-Control": "no-store",
    },
  });
}
