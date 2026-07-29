import * as cache from "@abextm/cache2";
import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { existsSync, readFileSync } from "node:fs";

import { createCacheProvider } from "./lib/cache";

// Mirrors item icons into the runeprofile-cdn R2 bucket, served at
// https://cdn.runeprofile.com/item/{id}.png.
//
// Covers every named item in the game cache (valuable drop events can
// reference any item, not just collection log ones). Icons are fetched from
// the RuneLite static CDN, which renders them from the game cache with the
// same pipeline the plugin's ItemManager uses. Collection log dummy IDs
// (e.g. 25627 for Coal bag) are named cache items too, so they're covered.
//
// Only IDs missing from the bucket are uploaded, so the recurring run is a
// no-op unless the game update added items. Flags:
//   --force              re-upload every icon
//   --seed-json <path>   prefer base64 icons from a plugin-generated
//                        item-icons.json over the RuneLite CDN (one-time
//                        seeding, keeps current visuals pixel-identical)
//
// Required env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
// Optional env: R2_BUCKET (default: runeprofile-cdn)

const RUNELITE_ICON_URL = (id: number) =>
  `https://static.runelite.net/cache/item/icon/${id}.png`;
const CONCURRENCY = 16;
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const force = process.argv.includes("--force");
const seedJsonIndex = process.argv.indexOf("--seed-json");
const seedJsonPath =
  seedJsonIndex === -1 ? null : process.argv[seedJsonIndex + 1];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const bucket = process.env.R2_BUCKET ?? "runeprofile-cdn";
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
  },
});

syncItemIcons()
  .then(() => console.log("Finished syncing item icons."))
  .catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
  });

async function syncItemIcons() {
  let seedIcons: Record<string, string> = {};
  if (seedJsonPath) {
    if (!existsSync(seedJsonPath)) {
      throw new Error(`Seed JSON not found: ${seedJsonPath}`);
    }
    seedIcons = JSON.parse(readFileSync(seedJsonPath, "utf-8"));
    console.log(
      `Loaded ${Object.keys(seedIcons).length} seed icons from ${seedJsonPath}`,
    );
  }

  console.log("Loading item definitions from the OSRS cache...");
  const items = await cache.Item.all(createCacheProvider());
  const itemIds = items
    .filter((item) => item.name && item.name.toLowerCase() !== "null")
    .map((item) => item.id as number);
  const existing = await listExistingIconIds();
  console.log(
    `${itemIds.length} named items in cache, ${existing.size} icons already in bucket.`,
  );

  const pending = force ? itemIds : itemIds.filter((id) => !existing.has(id));

  if (pending.length === 0) {
    console.log("All item icons are already synced.");
    return;
  }
  console.log(`Uploading ${pending.length} icons...`);

  let uploaded = 0;
  let fromSeed = 0;
  const notFound: number[] = [];
  const failed: Array<{ id: number; error: string }> = [];

  const queue = [...pending];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
        try {
          let png: Uint8Array;
          if (seedIcons[id]) {
            png = Buffer.from(seedIcons[id], "base64");
            fromSeed++;
          } else {
            const icon = await fetchRuneliteIcon(id);
            if (!icon) {
              notFound.push(id);
              continue;
            }
            png = icon;
          }

          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: `item/${id}.png`,
              Body: png,
              ContentType: "image/png",
              CacheControl: CACHE_CONTROL,
            }),
          );
          uploaded++;
          if (uploaded % 500 === 0) {
            console.log(`  ${uploaded}/${pending.length}`);
          }
        } catch (error) {
          failed.push({ id, error: String(error) });
        }
      }
    }),
  );

  console.log(
    `Uploaded ${uploaded} icons (${fromSeed} from seed JSON, ${uploaded - fromSeed} from RuneLite CDN).`,
  );

  if (notFound.length > 0) {
    // The apps would 404 on these today too (they hotlink the same CDN),
    // so this is a warning rather than a failure.
    console.warn(
      `No icon available upstream for ${notFound.length} items: ${notFound.slice(0, 50).join(", ")}${notFound.length > 50 ? ", ..." : ""}`,
    );
  }

  if (failed.length > 0) {
    for (const { id, error } of failed.slice(0, 20)) {
      console.error(`Failed to sync icon for item ${id}: ${error}`);
    }
    throw new Error(`${failed.length} icon uploads failed.`);
  }
}

async function listExistingIconIds(): Promise<Set<number>> {
  const ids = new Set<number>();
  let continuationToken: string | undefined;
  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: "item/",
        ContinuationToken: continuationToken,
      }),
    );
    for (const object of response.Contents ?? []) {
      const match = object.Key?.match(/^item\/(\d+)\.png$/);
      if (match) ids.add(Number(match[1]));
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
  return ids;
}

async function fetchRuneliteIcon(id: number): Promise<Uint8Array | null> {
  // Retry transient failures; a 404 means the icon doesn't exist upstream.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(RUNELITE_ICON_URL(id));
    if (response.ok) {
      return new Uint8Array(await response.arrayBuffer());
    }
    if (response.status === 404) {
      return null;
    }
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    } else {
      throw new Error(
        `RuneLite CDN returned ${response.status} for item ${id}`,
      );
    }
  }
  return null;
}
