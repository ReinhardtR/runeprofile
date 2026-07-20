import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createRemoteJWKSet, jwtVerify } from "jose";

export class AccessDeniedError extends Error {}

type AccessConfig = {
  teamDomain: string;
  appAud: string;
  adminEmail: string;
};

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function readEnvVar(name: string): string | undefined {
  try {
    const env = getCloudflareContext().env as unknown as Record<
      string,
      string | undefined
    >;
    if (typeof env[name] === "string") return env[name];
  } catch {
    // Not running inside a worker context (e.g. `next build`).
  }
  return process.env[name];
}

function readConfig(): AccessConfig | null {
  const teamDomain = readEnvVar("ACCESS_TEAM_DOMAIN");
  const appAud = readEnvVar("ACCESS_APP_AUD");
  const adminEmail = readEnvVar("ADMIN_EMAIL");
  if (!teamDomain || !appAud || !adminEmail) return null;
  if (teamDomain.includes("REPLACE") || appAud.includes("REPLACE")) return null;
  return { teamDomain, appAud, adminEmail };
}

/**
 * Verifies that the request passed through Cloudflare Access and was made by
 * the allowlisted admin. Throws AccessDeniedError otherwise — including when
 * Access is not (yet) configured, so the app fails closed.
 *
 * Local `next dev` is the only bypass; production builds always verify.
 */
export async function verifyAccessRequest(
  headers: Headers,
): Promise<{ email: string }> {
  if (process.env.NODE_ENV === "development") {
    return { email: "dev@localhost" };
  }

  const config = readConfig();
  if (!config) {
    throw new AccessDeniedError(
      "Cloudflare Access is not configured; refusing all requests",
    );
  }

  const token = headers.get("cf-access-jwt-assertion");
  if (!token) {
    throw new AccessDeniedError("Missing Cloudflare Access token");
  }

  const issuer = `https://${config.teamDomain}`;
  let jwks = jwksCache.get(config.teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    jwksCache.set(config.teamDomain, jwks);
  }

  let email: string;
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: config.appAud,
      algorithms: ["RS256"],
    });
    email = typeof payload.email === "string" ? payload.email : "";
  } catch {
    throw new AccessDeniedError("Invalid Cloudflare Access token");
  }

  if (email.toLowerCase() !== config.adminEmail.toLowerCase()) {
    throw new AccessDeniedError("Identity is not allowlisted");
  }

  return { email };
}
