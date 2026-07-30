<p align="center">  
  <a href="https://runeprofile.com">  
      <p align="center">  
        <img src="https://raw.githubusercontent.com/ReinhardtR/runeprofile-plugin/19b9e71c0135a06566e88b6d8ad96c0b86883c03/src/main/resources/logo.png" width="128" height="128" alt="Logo" />  
		</p>  
	</a>  
	<h1 align="center">
    <b>RuneProfile</b>
  </h1>
  <a href="#"></a>  
	<p align="center">  
    A place to share your OSRS achievements.  
    <br />  
    <a href="https://runeprofile.com"><strong>runeprofile.com</strong></a> 
    <p align="center">
      <img src="https://img.shields.io/endpoint?url=https://api.runelite.net/pluginhub/shields/installs/plugin/runeprofile" >
      <img src="https://img.shields.io/endpoint?url=https://api.runelite.net/pluginhub/shields/rank/plugin/runeprofile">
	<a href="https://github.com/ReinhardtR/runeprofile-plugin"><img src="https://img.shields.io/badge/GitHub-Plugin%20Repo-blue"></a>
    </p>
	</p>
  <br />
</p>

RuneProfile aims to be the best place to share your Old School RuneScape achievements with others.

The official Hiscores only shows a subset of your achievements and can be tough to navigate.

RuneProfile tries to display all of your important achievements and in a familiar UI.

The plugin is needed to upload your account data to RuneProfile, which will be displayed on the RuneProfile.com website.

You can read more about how to use RuneProfile here: [runeprofile.com/info/guide](https://runeprofile.com/info/guide).

## Project Structure

This project is a monorepo managed using Turborepo.

- `apps/api`: Backend application serving the API.
- `apps/web`: Frontend application for the website.
- `apps/admin`: Internal admin app (`admin.runeprofile.com`).
- `packages/runescape`: Shared package for RuneScape related data and utilities.
- `packages/db`: Database schema and client.
- `scripts/ts-scripts`: Data-sync scripts that read the OSRS cache (collection log, combat achievements, quests, icons).
- `scripts/item-icons`: Java CLI that renders item and sprite icons from the OSRS cache.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (version specified in root package.json)
- [pnpm](https://pnpm.io/) (version specified in root package.json)

### Installation

Run the setup script

```bash
pnpm dev:setup
```

Run the apps.

```bash
pnpm dev
```

Since the project is hosted with Cloudflare, this command utilizes `wrangler` and `miniflare` to simulate the Cloudflare environment locally.

The frontend will start at `localhost:3001` and the backend at `localhost:8787`.

### Game data and icons

The project has internal definitions of RuneScape data (in `packages/runescape`) that are used to validate data on the backend and display it on the frontend. These need to change whenever new content is released to the game — but that happens automatically.

The **Update Game Data** workflow runs daily and asks the [OpenRS2 archive](https://archive.openrs2.org) whether there is a game cache it hasn't processed yet. OpenRS2 mirrors the cache from Jagex within minutes of an update, so when one appears, the workflow downloads it once and runs everything against it:

- Regenerates the collection log, combat achievement and quest definitions in `packages/runescape`, opening a PR with a summary of what changed.
- Regenerates the hiscore and clan rank icon sheets in `apps/web/src/core/assets/`.
- Renders an icon for every item in the game and uploads the changed ones to the CDN (`cdn.runeprofile.com`), along with the collection log sprite sheet the site renders its grids from.

The PR needs review because a few fields can't be derived from the cache (collection log `hiscore`/`aliases`, quest `points`/`type`), and new collection log pages need those filled in by hand. Everything else, including all icons, is already live by the time the PR opens.

Icons are rendered headlessly from the cache using RuneLite's `cache` module — the same rasterizer the game client uses — so no game client, RuneLite plugin or manual step is involved. Item icons render at the same brightness the [OSRS Wiki](https://oldschool.runescape.wiki) uses.

#### Running it yourself

Data checks read the cache lazily over HTTP and need no setup:

```bash
pnpm script:check-clog     # or check-ca / check-quests to see pending changes
pnpm script:update-clog    # write the changes into packages/runescape
```

The icon scripts need an extracted cache, plus Java 11 for the renderer (Gradle 6.6.1 supports at most Java 15) and R2 credentials in `scripts/ts-scripts/.env`:

```bash
# Download the latest cache. --force is needed locally: without it the script
# only downloads a cache the daily workflow hasn't already processed.
pnpm script:check-cache --download /tmp/osrs-cache --force

OSRS_CACHE_DIR=/tmp/osrs-cache/cache pnpm script:update-sprite-icons
pnpm script:sync-item-icons --cache-dir /tmp/osrs-cache/cache
```

Rendering every item icon takes a few minutes, and both scripts are idempotent — re-running with an unchanged cache uploads nothing and leaves the asset files untouched.
