# Model viewer

A development harness for the GLB models the plugin's `GlbExporter` produces. It
renders a dump directly off disk, so an exporter change can be seen without
deploying the API or the website, and a suspect model can be compared against
what `apps/web` draws.

Deliberately outside the pnpm workspace (`apps/*`, `packages/*`, `scripts/*`), so
it is not a workspace package, `turbo build` never touches it, and it keeps its
own dependencies. It uses **npm**, not pnpm - it has a `package-lock.json`, and
running `pnpm install` in here will not do what you want.

```bash
cd tools/model-viewer
npm install
npm run dev
```

Nothing here ships. The renderer this checks against lives in
`apps/web/src/shared/model`, and the two are kept deliberately similar: when they
disagree, one of them has a bug, and comparing them is how the vertex-colour
double decode was found.

It lists `.runelite/runeprofile/models` on its own and loads the newest player
model straight away, so the loop is: run `::rpmodel` in the client, hit refresh,
look. Point the folder box somewhere else to read a different directory; the
path is remembered. Files can still be dropped on the page or opened from
anywhere with the file button.

Players and pets are listed separately and one of each can be shown at once.
The pet is placed where the profile page puts it relative to the player, so a
pair can be checked as it will actually appear; clicking the loaded one again
takes it back off.

Drag to orbit, and use the eight view buttons or `Orbit continuously`. Check
every angle, and check it moving. Nearly every fault found while building this
was invisible from the front and several only appeared in motion: a stale
triangle sort reads as flickering, and an overlay winning the wrong depth
comparison shows from one side only.

## On draw order

Ordinary depth testing for opaque geometry, plus a three part setup for
translucent geometry where each part alone looks like the fix and is not:

- opaque draws first and writes depth, so it occludes correctly
- translucent draws after, testing depth but **not writing it**, so it never
  hides another translucent surface
- `DepthSorter` orders translucent triangles back to front every frame the view
  changes, so blending comes out right

Back faces are culled everywhere, as the game does. On translucent geometry it
stops a shell being drawn twice, where two half transparent layers compound to
about three quarters and swamp whatever is behind. On opaque geometry it stops
the two sides of a thin surface - the feathers on a quiver's arrows - landing at
effectively the same depth and flickering against each other while the camera
moves.

Culling opaque geometry was avoided for a long time because it punched holes in
a cape. That turned out to be two unrelated bugs, since fixed: faces marked
never-draw by the `-2` sentinel were being exported, and the axis mapping was a
reflection rather than a rotation, so winding was inverted.

### Face render priority

The game paints faces in priority order rather than depth testing them, so an
overlay can sit *inside* the thing it decorates and still be drawn over it - a
necklace embedded in a chestplate is the case. Reading the client's own renderer
shows depth is primary and priority partitions that depth-ordered list into
strata: a higher priority face covers a lower one regardless of depth, but
*within* a stratum faces are still drawn far to near.

Reproducing that exactly means painting the whole model in strata with depth
writes off, which is what the client does for `RENDERMODE_SORTED_NO_DEPTH`. What
is done here instead is the approximation the client relies on everywhere else:
a bounded nudge towards the camera scaled by priority. See `priority-offset.ts`,
which records the three ways this was got wrong first.

### If transparency looks wrong again

Run `viewer.countSortInversions()` in the console from several angles before
theorising. It answers whether the sort itself is broken, which is worth knowing
first: a bug in there looks exactly like bad data or wrong alpha values, and it
took several wrong theories before counting inversions found one.

## Getting a model out of the game

Run a development client (`./gradlew run`, which enables assertions) and type:

```
::rpmodel   # writes the player, and the pet if one is out
```

Files land in `.runelite/runeprofile/models/`. The command is inert without
assertions enabled, so it cannot end up live in a released build.

There is also a synthetic two triangle model at `build/sample-models/sample.glb`,
written by `GlbWriterTest`, which is enough to check texturing and colour
handling without running the game at all.

The PLY the site currently ships is no longer dumped alongside. The two formats
have been compared and the loader here still reads `.ply` if one is opened by
hand, so nothing is lost by not writing them every time.

## Porting to the profile page

The site has to reproduce all of this, and each part exists because leaving it
out produced a visible fault. In rough order of how badly it shows:

| Setting | Where | Leaving it out |
|---|---|---|
| Translucent: `depthWrite = false` | `model.ts` | translucent surfaces hide each other |
| Translucent: triangles sorted back to front | `depth-sort.ts` | flickering while the camera moves |
| `side = FrontSide` on everything | `model.ts` | thin surfaces flicker; translucent shells go near opaque |
| Priority nudge, per vertex | `priority-offset.ts` | overlays vanish inside the armour they decorate |
| Frustum bracketing the model | `viewer.ts` `frameCamera` | edges flicker from depth precision |
| Pass through colour | `viewer.ts` `setColorMode` | everything renders too bright |
| Render on demand | `viewer.ts` | a static character burns battery forever |
| Dispose on swap | `model.ts` `disposeModel` | leaks a model's GPU memory per load |

The scale is already right: a GLB carries `1/128` on its root node, so a player
and pet come out correctly sized relative to each other with no hand tuned
constant. `PET_OFFSET` in `viewer.ts` is the site's own relative placement,
converted.

### What is worth stealing in detail

Three things in `src/viewer.ts` beyond draw order, and they are the parts most
likely to be dropped as incidental.

**It renders on demand.** A character is static most of the time, so a permanent
`requestAnimationFrame` loop redraws identical frames forever and costs a phone
real battery. The loop here only draws when something changed: the camera moved,
a model loaded, or an animated texture is mid scroll. With animation off and the
camera still, the FPS counter sits at 0 and the GPU is idle. Continuous drawing
is a state to enter, not the default.

**Colours pass straight through.** The game does no lighting, and the colours in
its models are already the values it puts on screen. So the accurate pipeline is
literal: no tone mapping, no linear working space, no output encoding, and
textures flagged as already being in the working space. The `Managed colour
space` toggle switches to three's default interpretation, where vertex colours
are taken to be linear, for comparison; that one comes out too bright.

Verified numerically rather than by eye: a vertex colour of `(200, 120, 60)`
exported by the plugin reads back as exactly `(200, 120, 60)` on screen, and a
textured face renders `texel × vertex colour` to the byte.

For the record, the live site's PLY path is *also* correct, by a different
route: `PLYLoader` decodes vertex colours as sRGB into a linear working space,
and three's default sRGB output encoding puts them back, so the round trip is
lossless. The two pipelines agree. `loadPly` here undoes that decode so both
formats hold literal bytes and can be compared side by side under the same
pass through settings — without it the PLY renders noticeably darker than the
GLB and the comparison is meaningless.

**Resources get disposed.** `disposeModel` in `src/model.ts` releases every
geometry, material and texture when a model is swapped out. three does not
reference count, so skipping this is the usual reason a viewer gets slower each
time you load something.

## Texture animation

An inferno cape's fire scrolls. glTF has no way to express that, so the exporter
writes the rate into each material's `extras`, which `GLTFLoader` surfaces as
`material.userData.runeprofile`, and `src/texture-scroll.ts` turns into a
per frame `texture.offset` nudge. The rate is in UV units per second and is
derived from the game's own animation direction and speed, so it matches what
the client draws.

Scrolling textures are the only animation here by design. The mesh itself is a
single frozen frame, which is exactly what preserves whatever stance the player
was in when they synced.
