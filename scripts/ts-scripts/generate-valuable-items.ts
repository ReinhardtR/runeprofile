import * as cache from "@abextm/cache2";
import fs from "fs/promises";
import path from "path";

import { ValuableDropThreshold } from "@runeprofile/runescape";

type ItemPrices = {
  timestamp: number;
  data: Record<
    string,
    {
      avgHighPrice: number;
      highPriceVolume: number;
      avgLowPrice: number;
      lowPriceVolume: number;
    }
  >;
};

generateJson()
  .then(() => console.log("Finished generating collection log items JSON."))
  .catch((error) => console.error("Error:", error));

async function generateJson(): Promise<void> {
  const valuableItems: Record<string, [string, string]> = {};

  console.log("Fetching item prices...");
  const itemPrices = await fetch(
    "https://prices.runescape.wiki/api/v1/osrs/5m",
  ).then((response) => response.json() as Promise<ItemPrices>);

  const valuableItemIds: string[] = [];
  for (const [itemId, itemData] of Object.entries(itemPrices.data)) {
    if (itemData.avgHighPrice >= ValuableDropThreshold) {
      valuableItemIds.push(itemId);
    }
  }

  const provider = new cache.FlatCacheProvider({
    getFile: async (name) => {
      const response = await fetch(
        `https://raw.githubusercontent.com/abextm/osrs-cache/refs/heads/master/${name}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${name}`);
      }
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    },
  });

  for (const itemId of valuableItemIds) {
    console.log(`Processing item ID: ${itemId}`);
    const itemData = await cache.Item.load(provider, parseInt(itemId));
    if (!itemData) {
      throw new Error(`Failed to load item data for ID: ${itemId}`);
    }
    const name = itemData.name;
    if (!name) {
      throw new Error(`Item name not found for ID: ${itemId}`);
    }
    const icon = await fetchAndEncodeImage(parseInt(itemId));
    if (!icon) {
      throw new Error(`Failed to fetch icon for item ID: ${itemId}`);
    }
    valuableItems[itemId] = [name, icon];
  }

  const outputPath = path.join(__dirname, "out", "item-icons.json");

  try {
    await fs.mkdir(path.join(__dirname, "out"), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(valuableItems), "utf-8");
    console.log(`Successfully wrote file to: ${outputPath}`);
  } catch (error) {
    console.error("Error writing JSON file:", error);
  }
}

async function fetchAndEncodeImage(itemId: number) {
  const imageUrl = `https://static.runelite.net/cache/item/icon/${itemId}.png`;
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64String = btoa(
    String.fromCharCode(...new Uint8Array(arrayBuffer)),
  );
  return base64String;
}
