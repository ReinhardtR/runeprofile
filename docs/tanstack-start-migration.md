# Migration plan: `apps/web` → TanStack Start on Cloudflare Workers

Goal: SSR'd head metadata (link previews with real data), Pages → Workers (Cloudflare's
recommended platform), smaller public API surface, and per-profile OG images.

Key insight: these are not two migrations — TanStack Start deploys as a Worker with
static assets, so the Start migration *is* the Pages→Workers migration.

## Phase 1 — Convert the SPA to TanStack Start (local only)

1. Deps: add `@tanstack/react-start`, `@tanstack/react-router-ssr-query`,
   `@cloudflare/vite-plugin`; remove `@tanstack/router-plugin` (subsumed by
   `tanstackStart()`).
2. `vite.config.ts` (order matters):
   `cloudflare({ viteEnvironment: { name: "ssr" } })`, `tanstackStart()`, `react()`,
   `tailwindcss()`. Keep the `~` alias.
3. `src/main.tsx` → `src/router.tsx` exporting `getRouter()`.
   - **QueryClient must be created per-request inside the factory** — the current
     module-level client with `staleTime: Infinity` would leak one user's data into
     another's SSR response.
   - `setupRouterSsrQueryIntegration({ router, queryClient })` replaces the manual
     `QueryClientProvider` and hydrates server-fetched loader data without refetching.
4. `__root.tsx` becomes the document: `shellComponent`/`RootDocument` rendering
   `<html><head><HeadContent/></head><body>…<Scripts/></body></html>`. Move all
   `index.html` meta (description, OG defaults, favicon/manifest links, global CSS via
   `?url`) into the root route `head()`.
5. Delete `index.html`, `functions/_middleware.ts`, `functions/tsconfig.json`,
   `public/_routes.json` — route `head()` is now SSR'd with real loader data, which
   replaces the edge middleware (and adds canonical username casing).
6. Client-only audit (main risk): `character.tsx` renders a three.js `<Canvas>` —
   wrap in `<ClientOnly>`/lazy import. Grep for `window`/`document`/`localStorage`
   in anything that renders during SSR.
7. SSR strategy: default `ssr: true` everywhere; dial individual routes down with
   `ssr: 'data-only'`/`false` only if they misbehave.

## Phase 2 — Worker configuration

```jsonc
// apps/web/wrangler.jsonc
{
  "name": "runeprofile-web",
  "compatibility_date": "<today>",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "observability": { "enabled": true }
}
```

Scripts: `dev: vite dev`, `build: vite build`, `preview: vite preview`,
`deploy: pnpm build && wrangler deploy`, `cf-typegen: wrangler types`.

## Phase 3 — Verification (before touching prod)

- Typecheck + build + `vite preview`; deploy to **workers.dev only**.
- `curl` raw HTML of `/:username`, `/group/:name`, `/clan/:name` — SSR'd titles/OG.
- Playwright pass: profile + 3D model, search dialog, client nav, 404 profile.
- Measure profile page TTFB and HTML size (dehydrated query payload).

## Phase 4 — Cutover (needs domain access)

1. Update API CORS list in `apps/api/src/index.ts` (pages.dev → workers.dev, then
   remove once done).
2. Move `runeprofile.com`/`www` custom domains from the Pages project to the Worker
   (low-traffic window; minutes).
3. Keep the Pages project as instant rollback for 1–2 weeks, then delete.
4. Workflow change: per-branch Pages preview URLs → `wrangler versions upload`
   preview URLs.

## Phase 5 — API surface reduction (separate PR, after soak)

Stays public on `api.runeprofile.com`:
- Plugin endpoints (RuneLite plugin calls `/profiles/*` writes: profile upload,
  accounts/:hash activities, models, set-default-clog-page, …)
- `/v1/*` (API-key public API)
- Discord interactions/webhooks

Moves behind the web Worker:
1. Service binding `runeprofile-web` → `runeprofile-api`.
2. SSR loaders fetch through the binding (no public round trip).
3. Client-side fetches hit the web Worker's own origin (`/api/*` proxy through the
   binding) — hono client base URL becomes `/api`; **removes browser CORS entirely**.
4. Then remove web-read endpoints (GET profile, search, hiscores, clans, groups,
   manifest) from the public router; expose via `WorkerEntrypoint` RPC or
   binding-only fetch. Check the Discord bot's internal reads first.

## Phase 6 — Per-profile OG images (separate PR)

- `/og/:username.png` on the web Worker via `workers-og` (Satori + resvg WASM,
  `@vercel/og`-style API with the `tw` prop).
- Content: username, account type, total/combat level, clog count — via the binding.
- Constraints: flexbox-only CSS subset; bundle a TTF/OTF font; static WASM imports
  (no dynamic WASM compilation on Workers); inline remote images as base64.
- `$username.tsx` `head()` sets `og:image` (1200×630) + `twitter:card:
  summary_large_image`.

## Caching & performance considerations

- **SSR HTML**: every profile view becomes Worker execution + API fetch (vs cached
  static shell today). Ship without HTML caching first and measure; if needed, Cache
  API with short TTL + stale-while-revalidate. Profile writes (plugin uploads) are a
  natural purge signal — follow-up, not launch scope.
- **Dehydrated payload**: full profile JSON (1,700+ clog entries) is embedded in the
  HTML. Brotli compresses it well; measure. The non-awaited hiscores
  `prefetchQuery` in the profile loader should become client-only so it never blocks
  or bloats SSR.
- **OG images**: `Cache-Control: public, s-maxage=86400` + Cache API; optional
  `updatedAt` cache-buster param. Satori ≈100–300ms CPU per render — fine, but cache
  anyway. Discord/Twitter cache unfurls on their side regardless.
- **Server bundle size**: Workers limit 3MB gzip (free) / 10MB (paid). Fonts + WASM
  fit, but three.js must stay behind ClientOnly/lazy so it never enters the SSR
  bundle. Check with `wrangler deploy --dry-run --outdir`.
- **Placement**: service bindings co-locate web+API Workers; if profile TTFB
  disappoints, Smart Placement on the web Worker is the knob.
- **Unchanged**: static assets stay CDN-cached (Workers Assets), intent-preload
  still works client-side, landing page could be prerendered later.

## References

- https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack/
- https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr
- https://tanstack.com/router/v1/docs/integrations/query
- https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
- https://github.com/kvnang/workers-og
