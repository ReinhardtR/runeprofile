# apps/admin — Agent operating rules (SECURITY-CRITICAL)

This app is the production admin panel at `admin.runeprofile.com`. It has
**full write access to the production database, R2 bucket, and KV namespace**
(delete accounts, mint API keys, mutate items/activities). Treat every change
here as a change to a security boundary.

Deploy steps and the Cloudflare Access dashboard setup live in
[DEPLOYMENT.md](./DEPLOYMENT.md).

## Security architecture — four layers, all must stay intact

| # | Layer | Where | What it does |
|---|-------|-------|--------------|
| 1 | Cloudflare Access | Zero Trust dashboard (not in repo) | Edge login (one-time PIN) — only the allowlisted admin email gets any request through to the worker |
| 2 | Middleware JWT check | `middleware.ts` → `lib/access.ts` | Cryptographically verifies the `Cf-Access-Jwt-Assertion` JWT (JWKS, issuer, audience, email claim) on every request; 403 otherwise |
| 3 | Per-entry-point guard | `lib/require-admin.ts` | `await requireAdmin()` is the first statement of **every exported server action** and of the root layout (`app/layout.tsx`), re-verifying the JWT independently of the middleware |
| 4 | No side doors | `wrangler.jsonc` | `workers_dev: false`, `preview_urls: false`, single custom-domain route; app **fails closed** (403 everything) if `ACCESS_TEAM_DOMAIN`/`ACCESS_APP_AUD` are missing or placeholders |

The layers are deliberately redundant: layer 3 exists so a middleware bypass
(e.g. a future Next.js CVE like CVE-2025-29927) still hits auth; layer 2 exists
so an Access misconfiguration still hits auth.

## Invariants — never violate, never "simplify" away

1. **Every new exported function in a `"use server"` file MUST start with
   `await requireAdmin();`.** No statements before it. This includes read-only
   actions — reads leak production data too.
2. **Never add a route handler (`route.ts`), API route, or metadata route that
   serves data without calling `requireAdmin()` first.** There are currently
   zero route handlers in this app; keep it that way unless one is genuinely
   needed, and guard it if so.
3. **Never remove or reorder the `requireAdmin()` call in `app/layout.tsx`.**
4. **Never widen the middleware matcher exclusions** in `middleware.ts` beyond
   `_next/static`. `/_next/image` and everything else that executes code must
   pass verification.
5. **The only auth bypass is `process.env.NODE_ENV === "development"`**
   (`lib/access.ts`). Never add another bypass condition — no env flags, no
   header checks, no IP allowlists, no "temporary" debug switches.
6. **No secrets in client code or bundles.** Nothing prefixed `NEXT_PUBLIC_`,
   no credentials in components. `DATABASE_URL` exists only in the gitignored
   `.env` for local dev; production DB access goes through the `HYPERDRIVE`
   binding — never add `DATABASE_URL` as a worker var or secret.
7. **`wrangler.jsonc`:** never set `workers_dev` or `preview_urls` to true,
   never add routes besides `admin.runeprofile.com`, never commit real secrets
   into `vars` (the `ACCESS_*` values are identifiers, not secrets — that's why
   they may live there).
8. **Static output is unauthenticated by design.** Files in `public/` and
   `.open-next/assets` are served by the ASSETS binding *before* middleware
   runs (Access still fronts them, but layers 2–3 don't). Never put sensitive
   data in `public/`, and keep pages dynamic — never prerender pages containing
   production data (the `requireAdmin()` in the root layout forces dynamic
   rendering; that is load-bearing). The only thing in `public/` today is
   `public/game-assets/` — non-sensitive game icon JSONs copied from
   `apps/web` by `scripts/copy-game-assets.mjs` (runs automatically before
   `dev`/`build`; gitignored along with its `lib/generated/` manifest). The
   Worker has no runtime filesystem — never add code that reads local files
   with `fs` at request time; bundle data at build time instead.
9. **Don't log sensitive values** — connection strings, JWTs, or raw API keys.
   `createApiKey` returns the raw key exactly once to the authed admin; it must
   never be logged or persisted anywhere but as its SHA-256 hash.
10. **No open proxies/SSRF.** Outbound fetches only to `API_URL` and known
    hosts; `images.remotePatterns` stays pinned to `static.runelite.net`.
    Never fetch a URL derived from request input.
11. Root `AGENTS.md` rules apply on top (e.g. never expose `account.id`;
    PlanetScale write-safety rules).

## Verification checklist — run after ANY change to this app

```sh
cd apps/admin

# 1. Guard parity: for every "use server" file, guards must equal exports
#    (root layout adds one extra requireAdmin, checked separately).
grep -rl '"use server"' app lib | while read -r f; do
  printf "%s exports=%s guards=%s\n" "$f" \
    "$(grep -c 'export async function' "$f")" \
    "$(grep -c 'await requireAdmin();' "$f")"
done

# 2. No secrets leaking toward the client bundle.
grep -rn "NEXT_PUBLIC\|DATABASE_URL\|pscale_pw" app components lib --include='*.ts' --include='*.tsx' | grep -v "lib/db.ts"

# 3. Types + production build must pass.
npx tsc --noEmit && pnpm build

# 4. After any wrangler.jsonc change:
npx wrangler deploy --dry-run && pnpm cf-typegen
```

## Cloudflare Access (dashboard-side) rules

- The Access application for `admin.runeprofile.com` must keep a **single
  Allow policy** matching one email. Never add `Bypass`, `Service Auth`, or
  `Everyone` policies, and never add a second identity provider.
- Changing the admin identity requires updating **both** the Access policy and
  the `ADMIN_EMAIL` var in `wrangler.jsonc` (layer 2/3 pins the email too).
- To cut off access immediately: Zero Trust → Access → Applications →
  RuneProfile Admin → revoke sessions (and/or disable the application).

## Local development

- `pnpm dev:admin` from the repo root. The Access check is bypassed only under
  `next dev`; production builds always verify.
- KV/R2 bindings are `remote: true` — local dev talks to **production** R2/KV
  and (via `DATABASE_URL`) the production database. There is no staging. Be as
  careful locally as you would be in prod.
