import * as cache from "@abextm/cache2";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Creates a cache provider for the data-sync scripts.
 *
 * When OSRS_CACHE_DIR is set (the unified daily pipeline downloads one
 * OpenRS2 disk store and points every script at it), reads that local
 * Jagex disk store. Otherwise falls back to lazily fetching abextm's
 * GitHub mirror over HTTP - convenient for one-off local runs since it
 * only downloads the files a script actually touches.
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

  return new cache.FlatCacheProvider({
    getFile: async (name) => {
      const response = await fetch(
        `https://raw.githubusercontent.com/abextm/osrs-cache/master/${name}`,
      );
      if (!response.ok) return;
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    },
  });
}
