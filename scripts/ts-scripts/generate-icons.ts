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
    }),
  );

  const outputPath = path.join(__dirname, "out", "item-icons.json");

  try {
    // Create the 'out' directory if it doesn't exist
    await fs.mkdir(path.join(__dirname, "out"), { recursive: true });

    // Write the JSON data to the file
    await fs.writeFile(outputPath, JSON.stringify(imageData, null, 2), "utf-8");
    console.log(`Successfully wrote image data to: ${outputPath}`);
  } catch (error) {
    console.error("Error writing JSON file:", error);
  }
}

async function fetchAndEncodeImage(itemId: number) {
  const imageUrl = `https://chisel.weirdgloop.org/static/img/osrs-sprite/${itemId}.png`;
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64String = btoa(
    String.fromCharCode(...new Uint8Array(arrayBuffer)),
  );
  return base64String;
}
