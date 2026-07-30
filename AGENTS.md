# AGENTS.md

Operating rules for automated agents working in this repository.

## PlanetScale

This project uses PlanetScale (`pscale` CLI). Targeting and safety rules for any
agent running database commands here:

| Setting  | Value                   |
| -------- | ----------------------- |
| Org      | `runeprofile`           |
| Database | `profiles` (PostgreSQL) |
| Branch   | `main` (production)     |

### Conventions

- Always pass `--format json` for machine-readable output.
- Put `--org runeprofile` on resource subcommands (`database`, `branch`, `sql`,
  `api`), **not** on the `pscale` root.
- Put positional args before flags (e.g. `pscale sql profiles main --org … --query …`).
- Start any session with `pscale auth check --format json`; re-run
  `pscale auth login --format json` if it reports `action_required`.

### Standard commands

```bash
pscale auth check --format json
pscale database list --org runeprofile --format json
pscale branch list profiles --org runeprofile --format json

# Read-only query (default --role reader)
pscale sql profiles main --org runeprofile --format json --query "SELECT 1"
```

### Safety / approval rules

- `main` is the **production** branch. Do not run writes or schema changes
  against it without explicit approval from the user.
- `DELETE`, `DROP`, and `TRUNCATE` are blocked by default and return
  `action_required` with `query_kind: "destructive"`. Ask the user, then re-run
  with `--force` **only** after they approve. Never use `--force` unprompted.

### Operational workflows

Load `14-pscale-cli-automation` for CLI conventions, or `00-safe-orchestrator`
for a full assessment.

## Rules

Never expose the account.id in API responses or through other fields.

## Game data and icon pipeline

The **Update Game Data** workflow is the single daily entry point: it gates on a
new OpenRS2 cache, downloads it once, and runs every data-sync script and the
icon sync against that same disk store (see the README for the contributor-facing
description). Invariants worth knowing before changing any of it:

- Scripts must read the cache through `createCacheProvider()` (honors
  `OSRS_CACHE_DIR`), never by fetching a mirror directly, or a pipeline run
  would mix cache versions across steps.
- The cache marker (`meta/last-processed-cache.json` in R2) is committed only
  after the whole run succeeds. Never advance it earlier — a failed run must
  retry on the next schedule.
- `clog-atlas.json` must be uploaded _after_ the content-hashed atlas PNG it
  references, so a live manifest never points at a missing object.
- Icon renders are deterministic: re-running against an unchanged cache must
  produce byte-identical output and upload nothing. If a change makes a
  re-render upload thousands of icons, that is a regression, not a no-op.
- Item icon brightness is `0.6`, which matches the OSRS Wiki and RuneLite's
  CDN exactly. Don't change it without the user explicitly asking.
- The RuneLite plugin has no role in asset generation. Do not reintroduce
  dev-tool icon generation there.

## apps/admin is security-critical

The admin app deploys to `admin.runeprofile.com` behind layered auth
(Cloudflare Access + JWT middleware + per-action guards). Before touching
anything under `apps/admin/`, read [apps/admin/AGENTS.md](apps/admin/AGENTS.md)
and follow its invariants and verification checklist.
