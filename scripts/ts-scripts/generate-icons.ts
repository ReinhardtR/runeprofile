import fs from "fs/promises";
import path from "path";

import { COLLECTION_LOG_ITEM_IDS } from "@runeprofile/runescape";

generateJson(COLLECTION_LOG_ITEM_IDS)
  .then(() => console.log("Finished generating collection log items JSON."))
  .catch((error) => console.error("Error:", error));

async function generateJson(ids: number[]): Promise<void> {
  const imageData: Record<string, string> = {};

  await Promise.all(
    ids.map(async (id) => {
      imageData[id] = await fetchAndEncodeImage(id);
      await new Promise((resolve) => setTimeout(resolve, 100)); // let the server breathe
    }),
  );

  const outputPath = path.join(__dirname, "out", "item-icons.json");

  try {
    await fs.mkdir(path.join(__dirname, "out"), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(imageData, null, 2), "utf-8");
    console.log(`Successfully wrote image data to: ${outputPath}`);
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
