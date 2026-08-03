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
import net.runelite.cache.SpriteManager;
import net.runelite.cache.definitions.SpriteDefinition;
import net.runelite.cache.fs.Store;
import net.runelite.client.hiscore.HiscoreSkill;

/**
 * Dumps the hiscore skill/boss/activity icons straight from the game cache,
 * headlessly - the same sprites the in-client dev tool exported, keyed the
 * same way (HiscoreSkill display name -> base64 PNG). The skill -> sprite id
 * mapping comes from RuneLite's HiscoreSkill enum (pure data, maintained
 * upstream, new hiscore entries appear with RuneLite releases).
 *
 * Usage: DumpHiscoreIcons <cacheDir> <outJson>
 */
public class DumpHiscoreIcons
{
	public static void main(String[] args) throws IOException
	{
		if (args.length < 2)
		{
			System.err.println("Usage: DumpHiscoreIcons <cacheDir> <outJson>");
			System.exit(2);
		}

		Map<String, String> icons = new LinkedHashMap<>();

		try (Store store = new Store(new File(args[0])))
		{
			store.load();

			SpriteManager spriteManager = new SpriteManager(store);
			spriteManager.load();

			for (HiscoreSkill skill : HiscoreSkill.values())
			{
				int spriteId = skill.getSpriteId();
				if (spriteId == -1)
				{
					continue;
				}

				SpriteDefinition sprite = spriteManager.findSprite(spriteId, 0);
				if (sprite == null)
				{
					System.err.println("No sprite in cache for " + skill.getName() + " (sprite " + spriteId + ")");
					continue;
				}

				BufferedImage image = spriteManager.getSpriteImage(sprite);
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				ImageIO.write(image, "png", baos);
				icons.put(skill.getName(), Base64.getEncoder().encodeToString(baos.toByteArray()));
			}
		}

		try (Writer writer = new FileWriter(args[1]))
		{
			new Gson().toJson(icons, writer);
		}
		System.out.println("Dumped " + icons.size() + " hiscore icons to " + args[1]);
	}
}
