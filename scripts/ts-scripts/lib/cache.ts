import * as cache from "@abextm/cache2";

/**
 * Creates a cache provider that reads the live OSRS cache straight from
 * abextm's mirror on GitHub. Shared by all of the data-sync scripts.
 */
export function createCacheProvider() {
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
