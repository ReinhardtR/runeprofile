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

RuneScape data definitions live in `packages/runescape`, and icons come from the game cache. Neither needs updating by hand.

The **Update Game Data** workflow checks daily whether the [OpenRS2 archive](https://archive.openrs2.org) has a new game cache. When it does, it regenerates the data definitions and icon sheets, renders every item icon to the CDN, and opens a PR with what changed. Icons are rendered with RuneLite's `cache` module, so no game client is involved.

The PR needs a quick review for the few fields the cache doesn't contain: collection log `hiscore`/`aliases` and quest `points`/`type`.

To run any of it yourself, see the `script:*` entries in `package.json`.
