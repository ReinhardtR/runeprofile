# Deploying the admin app — admin.runeprofile.com

## Security model (defense in depth)

1. **Cloudflare Access (Zero Trust)** sits in front of `admin.runeprofile.com` at Cloudflare's edge. Only a one-time PIN emailed to the allowlisted address gets through; every other request is blocked before it ever reaches the Worker.
2. **Middleware JWT verification** (`middleware.ts` + `lib/access.ts`): every request reaching the app must carry a valid `Cf-Access-Jwt-Assertion` token, cryptographically verified against the team's public keys (issuer, audience/AUD, and email claim all checked). Anything else gets a 403.
3. **Per-action guard**: every exported server action calls `requireAdmin()` (`lib/require-admin.ts`) as its first statement, re-verifying the same JWT independently of the middleware.
4. **No side doors**: `workers_dev: false` and `preview_urls: false` in `wrangler.jsonc` — the Access-protected custom domain is the only route to the Worker. The app **fails closed**: while `ACCESS_TEAM_DOMAIN` / `ACCESS_APP_AUD` still hold `REPLACE_ME` placeholders, every request 403s.

Database access in production goes through the `HYPERDRIVE` binding (same config as the API), so no database password is stored on the Worker at all.

> **Status (2026-07-20): steps 1–5 below are DONE** — provisioned via the
> Cloudflare API: Zero Trust org `runeprofile.cloudflareaccess.com`, One-time
> PIN login method, Access app `RuneProfile Admin` (id
> `cee28525-ddbb-4f6f-8f3d-00c63adb7110`) on `admin.runeprofile.com` with a
> single `admin-only` Allow policy for the admin email, and the real
> `ACCESS_TEAM_DOMAIN`/`ACCESS_APP_AUD` values are committed in
> `wrangler.jsonc`. Only step 6 (login + deploy) remains. The instructions are
> kept for disaster recovery / re-provisioning.

## One-time setup (Cloudflare dashboard, ~10 min)

1. **Zero Trust team**: go to <https://one.dash.cloudflare.com>. If you've never used Zero Trust, you'll be asked to pick a team name (free plan is fine). Note your team domain: `<team>.cloudflareaccess.com`.
2. **Login method**: Zero Trust → Settings → Authentication → Login methods → make sure **One-time PIN** is enabled (it is by default) and remove any other methods you don't want.
3. **Access application**: Zero Trust → Access → Applications → **Add an application** → **Self-hosted**:
   - Application name: `RuneProfile Admin`
   - Session duration: `24 hours` (or shorter if you prefer re-logging in)
   - Public hostname: `admin.runeprofile.com` (domain `runeprofile.com`, subdomain `admin`)
   - Identity providers: One-time PIN only
   - Policy: name `admin-only`, action **Allow**, Include → **Emails** → `reinhardtrijna@gmail.com` — and nothing else.
4. **Copy the AUD tag**: open the application you just created → Overview / Basic information → copy the **Application Audience (AUD) Tag**.
5. **Fill in the vars** in `apps/admin/wrangler.jsonc`:
   ```jsonc
   "ACCESS_TEAM_DOMAIN": "<team>.cloudflareaccess.com",
   "ACCESS_APP_AUD": "<the AUD tag>",
   ```
6. **Deploy**:
   ```sh
   npx wrangler login          # if not already logged in
   cd apps/admin
   pnpm deploy
   ```
   The deploy registers the `admin.runeprofile.com` custom domain and creates its DNS record automatically.

## Verify after deploying

- [ ] Incognito window → <https://admin.runeprofile.com> → you get the Cloudflare Access login page, **not** the app.
- [ ] Request a PIN for some other email address → denied ("That account does not have access").
- [ ] `reinhardtrijna@gmail.com` + PIN → app loads and works.
- [ ] `curl -sI https://admin.runeprofile.com | head -5` → a `302` redirect to `<team>.cloudflareaccess.com`, never app content.
- [ ] `https://runeprofile-admin.<account>.workers.dev` → does not resolve / no app (workers.dev disabled).

## Notes

- **Revoking access**: Zero Trust → Access → Applications → RuneProfile Admin → revoke existing sessions; or disable the app entirely.
- **Local dev is unchanged**: `pnpm dev:admin` from the repo root. The Access check is bypassed only when `NODE_ENV=development` (i.e. `next dev`); production builds always verify. Local dev needs a valid `wrangler login` because the KV/R2 bindings are `remote: true`.
- **Discord simulator**: the API's `/simulate/discord` endpoint refuses to run against the production Discord bot, so this tool remains effectively dev-only even though the page is deployed.
- `apps/admin/.env` (gitignored, local only) holds `DATABASE_URL` for dev plus `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` so the dev bindings proxy can emulate the Hyperdrive binding.
