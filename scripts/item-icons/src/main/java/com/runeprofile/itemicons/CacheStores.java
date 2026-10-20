package com.runeprofile.itemicons;

import java.io.File;
import java.io.IOException;
import net.runelite.cache.fs.Store;
import net.runelite.cache.fs.flat.FlatStorage;

final class CacheStores
{
	private CacheStores()
	{
	}

	/**
	 * Opens either cache layout: a client disk store (OpenRS2's disk.zip,
	 * main_file_cache.*) or a flat cache (abextm/osrs-cache's *.flatcache
	 * files), which publishes new caches within minutes of a game update.
	 */
	static Store open(File cacheDir) throws IOException
	{
		File[] flatFiles = cacheDir.listFiles((dir, name) -> name.endsWith(".flatcache"));
		if (flatFiles != null && flatFiles.length > 0)
		{
			return new Store(new FlatStorage(cacheDir));
		}
		return new Store(cacheDir);
	}
}
