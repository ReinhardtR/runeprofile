# PlanetScale 100% CPU investigation — 2026-09-05

## TL;DR

The database is not being abused — it's drowning in three self-inflicted inefficiencies on the
smallest Postgres cluster PlanetScale sells (PS-10, fractional vCPU, ~1 GB memory, no replicas,
memory permanently over threshold per server logs):

1. **Clan activity feed queries can't use their index for ordering** because the index was built
   `DESC NULLS LAST` while the queries order by plain `DESC` (= `DESC NULLS FIRST` in Postgres).
   Postgres scans and sorts *every* activity of the clan instead of reading the top N.
   Measured: **10,118 ms → 3.6 ms** (2,800×) by adding `NULLS LAST` to the ORDER BY.
   This family of queries is **~70% of total DB time**.
2. **Account search does a full index/seq scan per keystroke** — `LIKE 'prefix%'` on
   `lower(username)` can't use the btree under a non-C collation. Measured: 4.9 s, 252,633 rows
   filtered to return 10. **~21% of total CPU** (the single largest CPU consumer).
3. **The RuneLite plugin panel endpoint `GET /profiles/accounts/:id` hits Postgres on every poll**
   — 10.6M queries/day, **74% of all query volume** (~123 req/s), with no edge/KV caching even
   though clients send `If-Modified-Since`.

Fix 1 + 2 remove roughly two-thirds of CPU and ~80% of query wall-time. Fix 3 removes ~74% of
query volume. After these, PS-10 should be comfortable again; upgrading the cluster is not the
right first move.

---

## Evidence

### Cluster

- `profiles` / `main`: PostgreSQL, **PS-10** (`PS_10_AWS_ARM`), no replicas, `max_connections=100`.
- Server logs: continuous `warning(moomd): Memory over threshold: 561 MiB [non-reclaimable]` —
  the instance is memory-starved, so the big scans below also hit disk (gp3, 3000 IOPS).
- 24h totals (Insights): **14.35M queries**, ~174M ms of query wall-time (≈2 s of query time per
  wall-clock second), all traffic from Cloudflare Workers via Hyperdrive/postgres.js.

### 1. Clan activity feed — ~70% of DB time

All variants of `clan_activities ⋈ activities ⋈ accounts … ORDER BY created_at DESC, activity_id DESC LIMIT n`:

| Variant | count/24h | % of DB time | p50 | p99 |
|---|---|---|---|---|
| keyset paginated | 5,009 | 21.4% | 6.1 s | 35 s |
| no cursor | 2,084 | 12.7% | 7.4 s | 46 s |
| type-filtered | 6,820 | 10.1% | 0.8 s | 21 s |
| type-filtered + keyset | 13,410 | 9.8% | 0.1 s | 14 s |
| wide-columns variants | ~2,100 | ~8.8% | 3.8 s | 58 s |
| ascending direction | 1,493 | 7.4% | 5.6 s | 47 s |

`EXPLAIN (ANALYZE, BUFFERS)` for `clan_name = 'ironman cc' … LIMIT 20`:

- As written (`ORDER BY created_at DESC, activity_id DESC`): parallel index-only scan of all
  **107k rows** of the clan + explicit Sort, 69k buffers (~540 MB touched), **10,118 ms**.
- With `ORDER BY created_at DESC NULLS LAST, activity_id DESC NULLS LAST`: ordered index walk,
  21 buffers, **3.6 ms**.

Root cause: `clan_activities_name_created_at_id_desc_index` is
`(clan_name, created_at DESC NULLS LAST, activity_id DESC NULLS LAST)` but Drizzle's `desc()`
emits plain `DESC` = `DESC NULLS FIRST`, so the planner refuses the index for ordering.
Note the account-level activities query (`activities_account_id_created_at_id_index`, plain ASC,
scanned backwards) does **not** have this problem — p50 25 ms — which is also why
`activities_account_id_created_at_id_desc_index` (983 MB, 30% bloated, open PlanetScale
recommendation #17) is redundant and can simply be dropped.

Query sites:
- `apps/api/src/lib/clan/get-clan-activities.ts:65-90` (internal, edge-cached 600 s)
- `apps/api/src/public/v1/routes/clans.ts:313-453` (public v1, **no edge cache**)

Related bug found while reading these: the pagination cursor encodes `activities.created_at`
(`get-clan-activities.ts:117`, `v1/routes/clans.ts:414`) but the keyset predicate compares
`clan_activities.created_at`. The two columns have independent `defaultNow()` values, so pages
can skip/duplicate rows.

### 2. Account search — largest single CPU consumer

`GET /profiles?q=` → `apps/api/src/lib/profiles/search-profiles.ts:5-11`:
`lower(username) LIKE 'term%' ORDER BY lower(username) LIMIT 10`.

6,823 runs/24h, **1.5B rows read** (220k/query), 2.46M ms CPU (~21% of CPU). EXPLAIN shows the
unique index on `lower(username)` is walked end-to-end with a Filter (252,633 rows removed),
4.9 s — prefix `LIKE` can only become a btree range scan with `text_pattern_ops` / `COLLATE "C"`.
The route has no cache and no rate limit and fires per keystroke from the web search box.

Same class of problem: Discord clan autocomplete uses `ilike(accounts.clan_name, 'term%')` on the
raw column (`src/internal/discord/autocomplete.ts:40`), which can't use the `lower(clan_name)`
indexes either, and `SELECT DISTINCT clan_name … ILIKE` reads 254k rows/query (low volume today).

### 3. Plugin panel polling — 74% of all queries

`GET /profiles/accounts/:id` (`apps/api/src/internal/routes/profiles.ts:60-93`) runs
`SELECT username, account_type, clan_name, created_at, updated_at FROM accounts WHERE id=$1`
**10.64M times/24h** (~123/s). Each is cheap (p50 0.07 ms) but it's 74% of query volume and a
constant connection/CPU floor. A 90 s `wrangler tail` sample (9,239 events) confirms ~95% of API
traffic is this endpoint, coming from the RuneLite plugin (`RuneLite:1.12.x,Client:2.0.0`),
mostly with `If-Modified-Since` set — yet the route has no `cache()` middleware, no KV, and never
short-circuits to 304 without hitting Postgres.

### Abuse assessment (Cloudflare traffic)

**No abuse found.** The 90 s live sample shows:

- Traffic distributed across thousands of residential IPs / normal player countries
  (US 29%, GB 14%, AU 13%, NL 9%, …). Top IP made only 81 requests in 2 minutes.
- User agents: 98% RuneLite plugin versions. Known third-party consumers, all low-volume and
  well-behaved: `MangBot-RuneProfile` (Discord bot), `Dutch Valor Discord Bot`,
  `chaosemerald.cc (bingo onboarding)`, a `kill-clog` plugin fork, one custom `specialalch`
  client (~0.7 req/s).
- DB-side tags: essentially all load comes from the Workers' Hyperdrive user; no rogue direct
  connections.

The load is organic growth of the plugin install base meeting the three inefficiencies above.

**However, the audit surfaced real exposure worth fixing before someone does abuse it** (from
code review of `apps/api/src/internal/**`):

- `DELETE /profiles/:id` (deletes a whole profile), `DELETE /profiles/accounts/:id/activities/:activityId`,
  `POST /profiles`, `POST /profiles/activities`, `POST /profiles/models`,
  `POST /profiles/set-default-clog-page` — **no authentication of any kind**. Anyone who knows or
  brute-forces an account id/hash can delete or pollute profiles.
- The entire internal surface has **no rate limiting** (the CF rate-limit bindings are only
  mounted on public `/v1/accounts/*` and `/v1/clans/*`). The 5 s search query is unauthenticated
  and unlimited — a trivial DoS vector: a handful of concurrent `?q=` requests saturates the DB.
- Public v1 responses send `Cache-Control: max-age=60` but are never edge-cached server-side
  (no `cache()` middleware), so every v1 request hits Postgres.
- `packages/db/src/drizzle.ts:12` defaults `logger = true` — every SQL statement (with params)
  is written to Workers Logs on every request. Cost + noise + mild data-exposure.

### Data hygiene

- `clan_activities` holds **2.06M rows with `clan_name = ''`** (~40% of the hot index) that no
  query can ever read (both feed routes require non-empty clan names). Cause:
  `update-profile.ts:111` `clanName: updates.clan?.name ?? null` stores `""` as-is (`??` only
  catches null/undefined). Pure index bloat in the hottest index.
- `activities`: 23.3M rows / 13 GB; **15.4M rows (66%) are older than 90 days**. On a 1 GB box,
  retention/archival directly buys cache hit rate.
- Bloat: `activities_account_id_created_at_id_desc_index` 983 MB @30% (drop it instead of
  reindexing); `items` 317k dead tuples, `skills` 502k, `combat_achievement_tiers` reports 0 live
  tuples yet 138 MB on disk (needs `VACUUM`/`ANALYZE`, possibly `VACUUM FULL` in a window).
- Redundant indexes adding write amplification: `accounts_clan_name_index` (covered by
  `accounts_clan_name_id_index`), the activities desc index above.

---

## Recommended actions, in order of impact

1. **Add `NULLS LAST` to the clan-feed ORDER BY** (two sites:
   `get-clan-activities.ts`, `public/v1/routes/clans.ts`; Drizzle:
   ``sql`${col} desc nulls last` `` or recreate the indexes with plain column order).
   Zero-risk code change, removes ~70% of DB time. Fix the cursor column mismatch
   (`clan_activities.created_at` vs `activities.created_at`) while there.
2. **`CREATE INDEX CONCURRENTLY accounts_username_pattern_index ON accounts
   (lower(username) text_pattern_ops)`** — turns 4.9 s searches into ms. Also add edge caching
   (even `s-maxage=30`) + a rate limit on `/profiles?q=`, and fix the clan autocomplete to query
   `lower(clan_name)`.
3. **Cache `GET /profiles/accounts/:id`**: edge cache with short `s-maxage` (30–60 s) or KV keyed
   by account id (it's already invalidatable from `POST /profiles`), honoring
   `If-Modified-Since` → 304 without a DB round-trip. Cuts ~10.6M queries/day.
4. **Delete the `clan_name = ''` rows** from `clan_activities` (batched) and change
   `update-profile.ts` to store `null` for empty clan names.
5. **Auth + rate limits on the internal API**: at minimum, require the account-hash-derived token
   for destructive/POST routes, and mount a rate limiter on the internal router. Disable the
   Drizzle query logger in production. Add `cache()` to public v1 GET routes.
6. **Housekeeping**: drop `activities_account_id_created_at_id_desc_index` and
   `accounts_clan_name_index`; `VACUUM (ANALYZE)` items/skills/combat_achievement_tiers; decide a
   retention window for `activities` (e.g. keep 90 days hot, archive the rest to R2).
7. Only if CPU is still tight after 1–3: consider PS-20 or a read replica. Current data says it
   won't be needed.

## Measurements referenced

- Clan feed EXPLAIN before/after: 10,118 ms / 69k buffers → 3.6 ms / 21 buffers.
- Search EXPLAIN: 4,913 ms, 252,633 rows filtered for 10 results.
- Insights window: 24 h ending 2026-09-05 ~13:00 UTC.
- Traffic sample: `wrangler tail runeprofile-api`, 120 s span, 9,239 events.
