import * as cache from "@abextm/cache2";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Creates a cache provider for the data-sync scripts.
 *
 * When OSRS_CACHE_DIR is set (the icon pipeline downloads one OpenRS2 disk
 * store and points the icon renderer at it), reads that local Jagex disk
 * store. Otherwise reads abextm's GitHub mirror over HTTP - lazily, since
 * it only fetches the files a script actually touches. OSRS_CACHE_COMMIT
 * pins that mirror to a specific commit (the game-data pipeline sets this
 * to the commit check-data-cache.ts resolved, so every script in the same
 * run reads an identical, unmoving cache); it defaults to "master" for
 * one-off local runs.
 */
export function createCacheProvider(): cache.CacheProvider {
  const cacheDir = process.env.OSRS_CACHE_DIR;
  if (cacheDir) {
    return new cache.DiskCacheProvider({
      getFile: async (name) => {
        try {
          return new Uint8Array(await readFile(path.join(cacheDir, name)));
        } catch {
          return undefined;
        }
      },
    });
  }

  const ref = process.env.OSRS_CACHE_COMMIT ?? "master";
  return new cache.FlatCacheProvider({
    getFile: async (name) => {
      const response = await fetch(
        `https://raw.githubusercontent.com/abextm/osrs-cache/${ref}/${name}`,
      );
      if (!response.ok) return;
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    },
  });
}
