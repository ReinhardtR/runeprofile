# AGENTS.md

Operating rules for automated agents working in this repository.

## PlanetScale

This project uses PlanetScale (`pscale` CLI). Targeting and safety rules for any
agent running database commands here:

| Setting  | Value        |
|----------|--------------|
| Org      | `runeprofile` |
| Database | `profiles` (PostgreSQL) |
| Branch   | `main` (production) |

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