package com.runeprofile.itemicons;

import com.google.gson.Gson;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.Writer;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.imageio.ImageIO;
import net.runelite.cache.ConfigType;
import net.runelite.cache.IndexType;
import net.runelite.cache.SpriteManager;
import net.runelite.cache.definitions.EnumDefinition;
import net.runelite.cache.definitions.SpriteDefinition;
import net.runelite.cache.definitions.loaders.EnumLoader;
import net.runelite.cache.fs.Archive;
import net.runelite.cache.fs.ArchiveFiles;
import net.runelite.cache.fs.FSFile;
import net.runelite.cache.fs.Index;
import net.runelite.cache.fs.Storage;
import net.runelite.cache.fs.Store;

/**
 * Dumps the clan rank icons straight from the game cache, headlessly - the
 * same sprites the in-client dev tool exported, keyed the same way (clan rank
 * id -> base64 PNG).
 *
 * Entirely cache-native: enum 3798 (CLAN_RANK_GRAPHIC) maps every clan rank
 * id to its sprite id, so unlike the hiscore icons this needs no mapping
 * maintained outside the cache.
 *
 * Usage: DumpClanRankIcons <cacheDir> <outJson>
 */
public class DumpClanRankIcons
{
	private static final int CLAN_RANK_GRAPHIC_ENUM = 3798;

	public static void main(String[] args) throws IOException
	{
		if (args.length < 2)
		{
			System.err.println("Usage: DumpClanRankIcons <cacheDir> <outJson>");
			System.exit(2);
		}

		Map<String, String> icons = new LinkedHashMap<>();

		try (Store store = new Store(new File(args[0])))
		{
			store.load();

			SpriteManager spriteManager = new SpriteManager(store);
			spriteManager.load();

			EnumDefinition clanRankGraphics = loadEnum(store, CLAN_RANK_GRAPHIC_ENUM);
			int[] keys = clanRankGraphics.getKeys();
			int[] spriteIds = clanRankGraphics.getIntVals();

			for (int i = 0; i < keys.length; i++)
			{
				SpriteDefinition sprite = spriteManager.findSprite(spriteIds[i], 0);
				if (sprite == null)
				{
					System.err.println("No sprite in cache for clan rank " + keys[i]
						+ " (sprite " + spriteIds[i] + ")");
					continue;
				}

				BufferedImage image = spriteManager.getSpriteImage(sprite);
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				ImageIO.write(image, "png", baos);
				icons.put(Integer.toString(keys[i]), Base64.getEncoder().encodeToString(baos.toByteArray()));
			}
		}

		try (Writer writer = new FileWriter(args[1]))
		{
			new Gson().toJson(icons, writer);
		}
		System.out.println("Dumped " + icons.size() + " clan rank icons to " + args[1]);
	}

	private static EnumDefinition loadEnum(Store store, int enumId) throws IOException
	{
		Index configs = store.getIndex(IndexType.CONFIGS);
		Archive archive = configs.getArchive(ConfigType.ENUM.getId());
		Storage storage = store.getStorage();
		ArchiveFiles files = archive.getFiles(storage.loadArchive(archive));
		FSFile file = files.findFile(enumId);
		if (file == null)
		{
			throw new IOException("Enum " + enumId + " not found in cache");
		}
		return new EnumLoader().load(enumId, file.getContents());
	}
}
