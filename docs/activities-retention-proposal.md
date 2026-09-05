# Activities retention/archival — decision doc

**Date:** 2026-09-05
**Status:** Proposal — decision needed on whether to do anything at all
**Related:** `docs/db-cpu-investigation-2026-09-05.md` (CPU issues, handled separately)

## Current state (verified 2026-09-05, prod PS-10)

| | |
|---|---|
| `activities` | 23.3M rows, **13 GB** total (table + indexes) |
| rows older than 90 days | 15.4M (66%), oldest 2025-05-11 |
| insert rate | ~100k rows/day (~1.7 GB/month at current avg row cost), growing |
| indexes | pkey 1.7 GB, `(account_id, created_at, id)` 3.3 GB, `(account_id, type, created_at)` 1.9 GB, plus one redundant desc index being dropped separately |
| `clan_activities` | ~3.6M rows, **8.4 GB** (bloated after cleanup — see note below), FK → `activities.id` ON DELETE CASCADE |
| cluster | PlanetScale Postgres PS-10: ~1 GB RAM, 10–50 GB storage autoscaling, no replicas |

Read patterns: profile feeds and clan feeds are keyset-paginated and almost always
hit the first page; Discord notifications read recent rows only. The only reads of
old rows are users clicking "load more" repeatedly on a profile.

## 1. What retention would actually solve — and what it wouldn't

### Solves (real, but not urgent)

- **Working set vs 1 GB RAM.** The hot data (recent rows + index tips) is a small
  fraction of 13 GB, and keyset pagination means queries touch only the index range
  they return. But every GB of cold index still competes for buffer cache during
  vacuums, analyze, and any query that strays off the hot path. Halving the table
  roughly halves that background pressure.
- **Index sizes.** The two composite indexes total ~5.2 GB. Smaller indexes mean
  fewer levels, better cache residency, faster inserts (3 index maintenances per
  insert today).
- **Vacuum/analyze time.** Autovacuum cost scales with table size. At 23M rows it's
  fine; at 100M rows on a 1 GB box it starts eating the I/O budget.
- **Storage runway.** ~21 GB used by these two tables now, ~2+ GB/month growth,
  50 GB autoscale ceiling on this tier. At current rate the ceiling is roughly
  12–14 months out (sooner if plugin adoption keeps accelerating). Retention resets
  that clock indefinitely; without it, the alternative is a tier bump.

### Does NOT solve

- **The CPU problems.** Those are index/query issues being fixed separately. Once
  the feed queries are pure keyset scans on the right indexes, old rows are
  essentially inert — a 23M-row table and a 8M-row table cost the same per
  first-page query.
- **`clan_activities` being 8.4 GB.** That's bloat from the recent bulk cleanup
  (3.6M rows should be well under 2 GB). Deleting more rows makes it *worse* until
  the space is reclaimed. The fix is a one-off `pg_squeeze` (supported on
  PlanetScale) or `VACUUM FULL` during a quiet window — a separate, independent
  task worth doing regardless of this decision.
- **Deleted space ≠ reclaimed space.** Plain DELETEs return space to the table for
  reuse, not to the OS/billing. Storage graphs go flat, not down, unless you also
  squeeze. That's fine — flat is the goal — but don't expect the bill to drop the
  day retention ships.

**Honest framing:** with the CPU fixes landed, nothing is on fire. This is a
question of *when* to cap growth, not whether the current size is a problem today.

## 2. Options

### (a) Do nothing now; revisit at defined thresholds

Zero code, zero new moving parts, zero user-facing change. The cost is a calendar
reminder and a few queries once a month.

Watch (monthly, or when PlanetScale insights look off):

```sql
SELECT count(*) FROM activities;
SELECT pg_size_pretty(pg_total_relation_size('activities')),
       pg_size_pretty(pg_total_relation_size('clan_activities'));
-- cache hit ratio (want > ~0.98)
SELECT sum(blks_hit)::float / nullif(sum(blks_hit + blks_read), 0)
FROM pg_stat_database WHERE datname = current_database();
```

Trigger a decision when **any** of: `activities` > 50M rows; the two tables
> ~30 GB combined; cache hit ratio persistently < 0.98; autovacuum on `activities`
visibly lagging; or PlanetScale storage > ~35 GB total. At current growth the row
threshold lands around mid-2027.

- **Pros:** free; keeps full history for users; decision made with better data.
- **Cons:** the eventual first purge is bigger (but batched deletes don't care);
  risk of forgetting to check (mitigate: calendar entry, or a threshold alert).
- **Effort:** ~30 minutes to write down the checks.

### (b) Retention window with batched deletes (keep 12 months)

A Workers cron trigger on the API worker (`triggers.crons` is one config line plus
a `scheduled` handler) deletes rows older than 12 months in small batches.
`clan_activities` follows automatically via ON DELETE CASCADE. Steady state is
~100k rows/day — trivial. One-time catch-up of the backlog is a few hours of
batched deletes spread over some nights.

- **Pros:** simplest possible mechanism; ~1 day of work; caps growth forever;
  no new storage systems; fully reversible policy (just stop the cron).
- **Cons:** **old profile history is gone for good** — users paginating back past
  12 months hit the end. Whether anyone cares is unknown (worth checking: log how
  often feed queries request pages older than 12 months before committing).
  Deletes create dead tuples; autovacuum handles steady state, but the catch-up
  purge should be followed by a squeeze.
- **Effort:** ~1 day including the catch-up run. Sketch in §4.

### (c) Archive to R2, then delete

Monthly job exports old rows (NDJSON per month, or per account) to the existing R2
account, verifies the export, then deletes. Optionally a "cold history" read path
later that fetches from R2 when pagination runs past the DB window.

- **Pros:** history is never destroyed; R2 storage is effectively free at this
  scale; leaves the door open to restore or serve cold pages.
- **Cons:** this is where complexity lives. Export-verify-delete is a three-phase
  job with partial-failure states (exported but not deleted, deleted but export
  corrupt). Workers request limits mean chunked exports with multipart uploads.
  The cold read path is a second query engine: different format, different
  pagination, merge logic at the boundary — easily 2–3× the archival work itself,
  for a feature (deep history) with no demonstrated demand. Without the read path,
  the archive is write-only insurance nobody can see.
- **Effort:** 3–5 days for archive+delete done carefully; +3–5 days for a cold read
  path; ongoing maintenance of a second data format.

### (d) Native partitioning by `created_at`

PlanetScale Postgres does support this: `pg_partman` v5.5.0 is installable via
SQL, and `pg_partman_bgw` / `pg_cron` are available but require dashboard
enablement **and a database restart** (verified against
planetscale.com/docs/postgres/extensions, 2026-09-05). So the platform is not the
blocker. The migration is:

- Postgres requires the partition key in the PK, so `id text` PK becomes
  `(id, created_at)` — and `clan_activities`' FK can then no longer reference
  `activities(id)` alone. You'd have to add `created_at` to the FK (schema change
  + backfill on a bloated 8.4 GB table) or drop the FK and lose the cascade.
- Converting 23M rows means create-new-partitioned-table, dual-write or
  backfill-and-swap, under live inserts from the plugin. Days of careful work.
- Drizzle doesn't model partitions; all partition DDL lives outside the schema
  files, and every future migration has to tiptoe around it.
- **Payoff:** `DROP PARTITION` instead of DELETE — instant, no dead tuples. That's
  the only advantage over (b), and (b)'s delete volume (100k rows/day) doesn't
  need it.

- **Pros:** the "correct" solution at 10× the scale.
- **Cons:** highest complexity and migration risk in the list, permanent Drizzle
  impedance, restart required for automation extensions, solves a problem (delete
  cost) this workload doesn't have.
- **Effort:** 2–4 days plus real migration risk. Not justified at this size.

## 3. Recommendation

**Do (a) now. Pre-commit to (b) as the move when a threshold trips. Reject (c)
and (d).**

Reasoning:

1. The urgent problems (CPU) are solved elsewhere, and after those fixes the hot
   path doesn't touch old rows. Retention today buys headroom you don't yet need,
   at the cost of destroying user data before knowing whether anyone reads it.
2. Every option except (a) adds a permanent background process to a system
   maintained by one person. The bar for that should be an observed problem, not a
   projected one. The thresholds in (a) make "observed" concrete instead of vague.
3. (b) is the right eventual answer because it's the only option whose complexity
   matches the actual problem: cap table growth on a small box. (c) builds
   infrastructure for a deep-history feature nobody has asked for; (d) imports
   partitioning's migration and tooling costs to optimize deletes that are already
   cheap.
4. Two cheap actions now, independent of this decision: (i) squeeze
   `clan_activities` to reclaim the ~6+ GB of bloat — that alone buys months of
   storage runway; (ii) add a log/counter when a feed query's keyset cursor is
   older than 12 months, so the (b) decision about user impact is data-driven.

## 4. Implementation sketch for (b) — so it's a 1-day task when triggered

**Policy:** keep 365 days. One constant, one place.

**Cron trigger** in `apps/api/wrangler.jsonc`:

```jsonc
"triggers": { "crons": ["17 4 * * *"] }   // daily, off-peak UTC
```

`apps/api/src/index.ts` — add alongside the Hono fetch export:

```ts
export default {
  fetch: app.fetch,
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(purgeOldActivities(env));
  },
};
```

**Batched delete** (Drizzle `sql` or raw via Hyperdrive). Loop with a batch cap
per invocation rather than "until done":

```sql
WITH doomed AS (
  SELECT id FROM activities
  WHERE created_at < now() - interval '365 days'
  ORDER BY created_at
  LIMIT 5000
)
DELETE FROM activities a
USING doomed d
WHERE a.id = d.id;
-- clan_activities rows cascade automatically
```

```ts
const RETENTION_DAYS = 365;
const BATCH = 5000;
const MAX_BATCHES_PER_RUN = 20;      // ≤100k rows/night; catch-up takes ~2 weeks
const FLOOR = "2025-05-11";          // hard guard: never delete past known-oldest+policy sanity

for (let i = 0; i < MAX_BATCHES_PER_RUN; i++) {
  const { rowCount } = await db.execute(purgeSql);
  console.log(JSON.stringify({ job: "activity-purge", batch: i, deleted: rowCount }));
  if (rowCount < BATCH) break;
}
```

**Safety rails:**

- Assert `RETENTION_DAYS >= 180` at startup — a typo'd constant must fail loud,
  not delete a year of data.
- First deploy with the DELETE replaced by `SELECT count(*)` (dry run) for a few
  nights; compare counts against expectation (~100k/day steady state).
- `MAX_BATCHES_PER_RUN` caps blast radius; a bug can only overdelete one night's
  quota before the logs show it.
- The `ORDER BY created_at` batch scan is satisfied by existing indexes only via
  seq-ish access; if it's slow, batch on `created_at < cutoff` bounds per
  month instead. Measure on the first catch-up run.
- After the catch-up finishes, run `pg_squeeze` on both tables once to return the
  freed space; steady-state deletes are then absorbed by normal autovacuum reuse.
- Keep the "cursor older than 12 months" counter from §3 running for a month
  before enabling — if real users page that deep, reconsider the window (18–24
  months costs little).

**Rollback:** delete the cron trigger. Data already purged is gone — which is why
the dry run and the usage counter come first.
