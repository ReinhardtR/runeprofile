# Server loot feed + collection log quantity sync

Spans two repos: `runeprofile-plugin` (RuneLite plugin) and `runeprofile`
(`apps/api`, `packages/runescape`).

## Problem

Autosync only reacts to *new* collection log items, via
`CollectionNotificationSubscriber` (chat message + notification popup). A
duplicate of an already-obtained item produces no message and no popup, so
nothing is stored and nothing is synced. The stored `items.quantity` then stays
stale until the next full clog transmit, and `!log` — which reads the DB in
`apps/api/src/lib/collection-log/get-collection-log-page.ts` — reports wrong
`xN` counts.

Separately, `ValuableDropSubscriber` listens to `LootReceived`, which is posted
only by RuneLite's **Loot Tracker plugin**. Anyone with that plugin disabled
gets no valuable-drop tracking at all, silently.

## Decisions

| Decision | Rationale |
| --- | --- |
| Use the game's server-side loot scripts as the loot feed | Exact item ids, no name lookup, no dependency on another plugin |
| Migrate valuable drops **fully** to the feed | Owner's call; single loot path in the plugin |
| Keep `CollectionNotificationSubscriber` for first obtains | Only signal that means "the log credited this"; covers non-loot obtains (shops, quests, reward shops) |
| Item quantity increases come from the feed as **deltas** | Wrongness is bounded and self-heals on the next clog open |
| No use of `COLLECTION_COUNT` (varp 2943) | Owner's call — not part of this design |
| No source→page verification | Deferred; not needed while deltas only touch already-obtained items |

### Accepted risks

1. The feed is gated behind the in-game setting **Loot Tracker – Track loot**
   (`VarbitID.OPTION_LOOTTRACKER_DISABLED`, 14879). When off, the server does
   not invoke the scripts at all, so both features go dark. RuneLite issues
   [#19001](https://github.com/runelite/runelite/issues/19001) /
   [#19017](https://github.com/runelite/runelite/issues/19017); the toggle is
   only reachable from the official client or mobile. Mitigated by detecting the
   varbit and warning the player once. Default appears to be enabled — confirm
   in verification step 1.
2. Valuable drops have no fallback after the migration. If 7194/7196/7198 turn
   out not to fire for raid chests, purples stop being recorded. Verification
   step 2 gates the release.
3. Loot keys are excluded outright. A wilderness loot key chest hands over what
   the player you killed was carrying, which the collection log does not credit
   and which is not your own drop, so loot reported while that interface
   (`InterfaceID.WILDY_LOOT_CHEST`) is open is dropped before it reaches either
   consumer. Note this also removes it from valuable drops, where the old
   `LootReceived` path did record it as an `EVENT` source.
4. Per-item counts have a server-side cap that varies by item (65,535 for
   Zulrah's scales, 250 for bracelets of ethereum). The cap is not in the game
   cache — scanning every enum and struct for it finds nothing, and the log's own
   draw scripts never read one — so deltas can push a stored count above it.
   Every authoritative number is already capped, so only our own arithmetic
   drifts, and a full transmit corrects it. Script 4100's unused third argument
   is logged in dev builds in case the server sends the cap there.

Counts are tracked per item across the whole log, not per page: an item obtained
from one source shows the same count on every page that lists it. The item id ->
quantity model is therefore exact, not a flattening.

## The feed

Four server-invoked clientscripts, all feeding the game's own loot tracker:

| Script | Source param | Covers |
| --- | --- | --- |
| 7192 | `npc` | NPC kills, pickpockets — this is what RuneLite exposes as `ServerNpcLoot` |
| 7194 | `loc` | objects: chests, lockers |
| 7196 | `obj` | opening an item: clue caskets, keys |
| 7198 | `int` → name enum | named events |

Uniform arg layout via `ScriptPreFired.getScriptEvent().getArguments()`:
`[0]` script id, `[1]` source, `[2]` event id (groups one loot event),
`[3]` item id, `[4]` quantity. Same indexing the existing
`CollectionLogWidgetSubscriber` uses for script 4100.

Notes:

- One script call **per item**; group by `args[2]` and flush on event-id change
  or tick end, mirroring `LootManager.processScriptLoot`.
- The game's own normalization (`~script4851`: uncert + clue-variant collapse)
  runs *inside* the script, so prefire args carry the raw, possibly-noted id →
  keep `ItemUtils.getUnnotedItemId`.
- Player-kill loot never appears here (that is `PlayerLootReceived` only), so the
  `LootRecordType.PLAYER` guard disappears.
- 7192 items may be loot that was dropped for the player but never picked up —
  a slight semantic change for non-NPC valuable drops, which previously came
  from inventory diffing.
- Siblings 7191/7193/7195/7197 call `loottracker_sourceadd` — server-authoritative
  kill counts per source. Out of scope, noted for later.

## Part 1 — `ServerLootSubscriber` (plugin)

New `autosync/ServerLootSubscriber.java`:

- `@Subscribe onScriptPreFired` for the four ids; defensive null/length checks on
  the script event and argument array.
- Accumulate `(itemId, qty)` per event id; flush on event-id change or `GameTick`.
- Resolve a source name for logging only (`getNpcDefinition` / object comp /
  item comp / `client.getEnum`). Nothing depends on it.
- Post a plugin-internal `ServerLootReceived(source, List<ItemStack>)`.
- Gate: `PlayerState.isValidPlayerState`.
- If `client.getVarbitValue(VarbitID.OPTION_LOOTTRACKER_DISABLED) == 1`, log and
  emit one chat message per session telling the player to enable **Loot Tracker
  – Track loot** (official client or mobile) for RuneProfile to track drops.

Two consumers: valuable drops and clog quantities.

## Part 2 — Valuable drops migration

`ValuableDropSubscriber`: replace `onLootReceived(LootReceived)` with
`onServerLootReceived`. Everything downstream is unchanged — manifest value
overrides, `resolveThreshold`, `ItemUtils.getPerceivedItemValue`, one
`ValuableDropActivity` per unit of quantity, `plugin.addActivitiesAsync`.

Removals: the `LootRecordType.PLAYER` check, the `LootReceived` /
`net.runelite.http.api.loottracker` imports, and the implicit dependency on the
Loot Tracker plugin. `config.trackValuableDrops()` stays.

## Part 3 — Collection log quantity deltas

### Plugin

- `PlayerDataService`: add `pendingItemDeltas` (`itemId -> summed qty`) and
  `addItemDelta`. Deltas are **drained when the payload is built** and restored
  on failure, so a sync starting mid-flight cannot send them twice — they are
  relative, so a duplicate doubles the count. Stored clog items are absolute and
  only cleared for what was actually sent, replacing the blanket `reset()` that
  silently dropped items obtained during an in-flight update.
- `ServerLootSubscriber` consumer: unnote → keep only ids in the manifest clog
  set → `addItemDelta` → `autoSyncScheduler.startRapidSync("server-loot")`.
- `CollectionLogWidgetSubscriber`: when a full transmit completes (existing
  `tickCollectionLogScriptFired + 2` gate in `onGameTick`), discard deltas
  recorded before the transmit started — the snapshot is authoritative and would
  otherwise double-count. Also clear deltas alongside `clearItems()` in the
  adventure-log guards.
- `PlayerData`: new `Map<Integer, Integer> itemDeltas`.
- Only one full profile sync runs at a time. The lock lives in
  `RuneProfilePlugin.updateProfileAsync`, the one place every entry point goes
  through; a sync requested while one is running sets a flag that triggers a
  follow-up when it finishes, so nothing is dropped. `AutoSyncScheduler` no
  longer keeps its own flag (it released it before the request completed, so it
  never blocked anything) and now swallows exceptions, which previously killed
  the scheduling cycle for the session.
- No config option: quantity tracking is part of auto-sync, gated on
  `autosyncProfile()` plus the manifest flag.
- `Manifest.java`: `collectionLogItemIds` and `itemQuantityDeltasEnabled`
  (Java default `false`, so a missing/old manifest disables the feature).
- `DiagnosticsLog`: development-only text log, active only when assertions are
  enabled (`-ea`), which is true for a dev client and never for a released
  build. No config option, cannot ship switched on.

### API

- `packages/runescape` / `apps/api/src/lib/manifest/get-manifest.ts`: bump
  manifest `version` to 3; serve `collectionLogItemIds` (from
  `COLLECTION_LOG_ITEM_IDS`, ~12 KB on the hourly refresh) and
  `itemQuantityDeltasEnabled`.
- `apps/api/src/internal/routes/profiles.ts` POST validator: add
  `itemDeltas: z.record(z.coerce.number(), z.number()).optional()`.
- `get-profile-updates.ts`: emit a separate `itemDeltas: Array<{id, delta}>` on
  `ProfileUpdates` (do **not** fold into `items`, which is absolute-valued and
  feeds the diff cache). Rules:
  1. drop ids not in `COLLECTION_LOG_ITEM_IDS`;
  2. drop any id also present in the absolute `items` map — a clog transmit wins;
  3. clamp each delta to `1..1000`;
  4. ignore all deltas when `forceResync` is armed.
- `update-profile.ts`: inside the existing transaction, group deltas by value
  (almost all are `+1`) and issue one statement per group:
  ```sql
  UPDATE items SET quantity = quantity + $d
  WHERE account_id = $1 AND id IN (...) AND quantity > 0
  RETURNING id, quantity
  ```
  `quantity > 0` is what keeps this safe without source verification: deltas only
  ever touch items already known obtained, never insert a row, and can never
  reach 0. Feed the returned rows into `buildUpdatedDiffProfile` so the KV cache
  matches the DB; fall back to `deleteDiffProfileCache` if the plumbing gets
  awkward.
- `get-profile-updates.ts`, separate fix: thread `isFullItemPayload` into
  `getItemUpdates` and **skip downward quantity moves for partial payloads**.
  Item regression is currently allowed unconditionally (unlike quests/skills/
  diaries), so a partial autosync can clobber a freshly applied delta. Full clog
  transmits keep their authority to correct counts downward.
- `detectItemDiscrepancies`: leave as-is. It becomes the accuracy telemetry for
  deltas — inflation shows up there.
- Activity events: delta-derived rows can never emit `new_item_obtained`
  (`checkNewItemObtainedEvents` skips `oldQuantity > 0`, and rule 4 above means
  deltas only apply to rows already `> 0`).

### Race conditions

| Race | Resolution |
| --- | --- |
| Delta recorded while a full clog transmit runs | Discard deltas from before transmit completion |
| Delta + absolute value for the same item in one payload | Absolute wins |
| Delta arrives during an in-flight update | Deltas leave the pending map when the payload is built, and are restored on failure |
| A second sync starts while one is in flight | Rejected by the sync lock; a follow-up runs afterwards |
| Partial autosync lowers a freshly incremented quantity | Downward moves now require a full payload |
| Stale KV diff cache | Deltas are SQL-side arithmetic against the real row; cache updated from `RETURNING` |
| `forceResync` armed | Deltas ignored |

## Verification (gates the release)

1. Read varbit 14879 on a normal account — is **Loot Tracker – Track loot** on by
   default?
2. Log all four script ids with `(source, eventId, itemId, qty)` and run:
   boss kill, slayer task, pickpocket, Barrows chest, each clue tier casket,
   CoX/ToA chest, Wintertodt/Tempoross crate, GOTR, implings, birdhouse. Negative
   controls: buy a Graceful piece, claim a quest reward. **Raid chests firing is
   required for the valuable-drop migration.**
3. Confirm quantities for stacked clog items arrive as the full stack, not 1.
4. Confirm no duplicate reporting when a single kill involves multiple sources
   (Yama + throne — see RuneLite commit `936f72b7`).

## Rollout

1. API accepts and safely ignores `itemDeltas` (unit tests in
   `get-profile-updates.test.ts`: precedence, no-insert, floor-1, `forceResync`,
   partial-payload regression block).
2. Plugin ships `ServerLootSubscriber` + valuable-drop migration, deltas off via
   manifest flag.
3. Verification steps above on live content.
4. Flip `itemQuantityDeltasEnabled`; watch the discrepancy KV for a week.

## Latent bugs found on the way

- `CollectionNotificationSubscriber.java:99` tests
  `getVarbitValue(OPTION_COLLECTION_NEW_ITEM) != 1`, but that varp is a bitfield
  (procs 5188/5189 toggle bits 0 and 1 independently). If bit 0 is the popup
  rather than the chat message, "chat on, popup off" reads as 2 and the chat path
  bails — a missed-item path unrelated to other plugins. Should be a bit test;
  confirm which bit is which.
- `RuneProfilePlugin.java:216` blanket `reset()` — covered by the drain fix above.

## Deferred

- Source→page verification via a manifest-delivered map, which would allow
  crediting *first* obtains from the feed (all four scripts hand us the source
  name). Only worth building if delta inflation shows up in telemetry, or if the
  notification path proves lossy in practice.
- Server-authoritative kill counts from 7191/7193/7195/7197.
