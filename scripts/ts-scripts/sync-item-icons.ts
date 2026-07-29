import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { COLLECTION_LOG_ITEMS } from "@runeprofile/runescape";

// Renders an icon for every named item in the OSRS cache and syncs them into
// the runeprofile-cdn R2 bucket, served at
// https://cdn.runeprofile.com/item/{id}.png.
//
// Also composes every collection log item icon into a single sprite-sheet
// atlas so the web app can render clog pages atomically with one request:
//   clog-atlas.{contenthash}.png  (immutable)
//   clog-atlas.json               (stable URL, short TTL manifest with the
//                                  atlas URL, cell size and id -> [x, y])
// The manifest is uploaded after the atlas it references, so a live
// manifest always points at an existing atlas.
//
// Fully self-contained: downloads the latest live cache from the OpenRS2
// archive (updated within hours of a game update), renders icons headlessly
// with the RuneLite cache module (scripts/item-icons - the same rasterizer
// the client uses, including quantity-based stack variants), then uploads
// every icon whose bytes differ from what's in the bucket (compared via MD5
// against the R2 ETag), so both new and visually changed icons are synced.
//
// Flags:
//   --force              upload every icon even if unchanged
//   --icons-dir <path>   skip the download+render steps and upload
//                        pre-rendered icons from this directory
//
// Required env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
// Optional env: R2_BUCKET (default: runeprofile-cdn)

const OPENRS2_CACHES_URL = "https://archive.openrs2.org/caches.json";
const UPLOAD_CONCURRENCY = 16;
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RENDERER_DIR = path.resolve(__dirname, "../item-icons");
const WORK_DIR = path.join(RENDERER_DIR, "work");

const force = process.argv.includes("--force");
const iconsDirIndex = process.argv.indexOf("--icons-dir");
const prerenderedDir =
  iconsDirIndex === -1 ? null : process.argv[iconsDirIndex + 1];

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
  const iconsDir = prerenderedDir ?? (await renderIcons());

  const files = readdirSync(iconsDir).filter((f) => /^\d+\.png$/.test(f));
  if (files.length === 0) {
    throw new Error(`No rendered icons found in ${iconsDir}`);
  }

  const existing = await listExistingIcons();
  console.log(
    `${files.length} rendered icons, ${existing.size} icons in bucket.`,
  );

  const pending: Array<{ id: number; filePath: string }> = [];
  let unchanged = 0;
  for (const file of files) {
    const id = Number(file.replace(".png", ""));
    const filePath = path.join(iconsDir, file);
    if (!force) {
      const etag = existing.get(id);
      if (etag) {
        const md5 = createHash("md5")
          .update(readFileSync(filePath))
          .digest("hex");
        if (etag === md5) {
          unchanged++;
          continue;
        }
      }
    }
    pending.push({ id, filePath });
  }

  if (pending.length === 0) {
    console.log(`All ${unchanged} item icons are already up to date.`);
    await uploadClogAtlas(iconsDir);
    return;
  }
  console.log(`Uploading ${pending.length} icons (${unchanged} unchanged)...`);

  let uploaded = 0;
  const failed: Array<{ id: number; error: string }> = [];

  const queue = [...pending];
  await Promise.all(
    Array.from({ length: UPLOAD_CONCURRENCY }, async () => {
      for (let job = queue.shift(); job !== undefined; job = queue.shift()) {
        try {
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: `item/${job.id}.png`,
              Body: readFileSync(job.filePath),
              ContentType: "image/png",
              CacheControl: CACHE_CONTROL,
            }),
          );
          uploaded++;
          if (uploaded % 500 === 0) {
            console.log(`  ${uploaded}/${pending.length}`);
          }
        } catch (error) {
          failed.push({ id: job.id, error: String(error) });
        }
      }
    }),
  );

  console.log(`Uploaded ${uploaded} icons (${unchanged} unchanged).`);

  if (failed.length > 0) {
    for (const { id, error } of failed.slice(0, 20)) {
      console.error(`Failed to upload icon for item ${id}: ${error}`);
    }
    throw new Error(`${failed.length} icon uploads failed.`);
  }

  await uploadClogAtlas(iconsDir);
}

// Item icons are always 36x32.
const CELL_WIDTH = 36;
const CELL_HEIGHT = 32;
const ATLAS_COLUMNS = 40;

async function uploadClogAtlas(iconsDir: string) {
  const clogItemIds = Object.keys(COLLECTION_LOG_ITEMS)
    .map(Number)
    .sort((a, b) => a - b);

  const cells: Array<{ id: number; filePath: string }> = [];
  const missing: number[] = [];
  for (const id of clogItemIds) {
    const filePath = path.join(iconsDir, `${id}.png`);
    if (existsSync(filePath)) {
      cells.push({ id, filePath });
    } else {
      missing.push(id);
    }
  }
  if (missing.length > 0) {
    // The web app falls back to per-item icon URLs for anything the
    // manifest doesn't cover, so this is a warning rather than a failure.
    console.warn(
      `${missing.length} collection log items have no rendered icon and were left out of the atlas: ${missing.join(", ")}`,
    );
  }

  const rows = Math.ceil(cells.length / ATLAS_COLUMNS);
  const width = ATLAS_COLUMNS * CELL_WIDTH;
  const height = rows * CELL_HEIGHT;

  const icons: Record<number, [number, number]> = {};
  const composites = cells.map(({ id, filePath }, index) => {
    const x = (index % ATLAS_COLUMNS) * CELL_WIDTH;
    const y = Math.floor(index / ATLAS_COLUMNS) * CELL_HEIGHT;
    icons[id] = [x, y];
    return { input: filePath, left: x, top: y };
  });

  const atlas = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer();

  const hash = createHash("md5").update(atlas).digest("hex").slice(0, 16);
  const atlasKey = `clog-atlas.${hash}.png`;

  const manifest = JSON.stringify({
    atlas: `https://cdn.runeprofile.com/${atlasKey}`,
    width,
    height,
    cellWidth: CELL_WIDTH,
    cellHeight: CELL_HEIGHT,
    icons,
  });

  // Atlas first, manifest second: a live manifest must always reference an
  // atlas that already exists.
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: atlasKey,
      Body: atlas,
      ContentType: "image/png",
      CacheControl: CACHE_CONTROL,
    }),
  );
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: "clog-atlas.json",
      Body: manifest,
      ContentType: "application/json",
      CacheControl: "public, max-age=300",
    }),
  );
  console.log(
    `Uploaded clog atlas ${atlasKey} (${cells.length} icons, ${width}x${height}, ${Math.round(atlas.length / 1024)}KB) and manifest.`,
  );
}

// Downloads the latest live cache from OpenRS2 and renders all item icons
// with the Java renderer. Returns the directory the PNGs were written to.
async function renderIcons(): Promise<string> {
  console.log("Finding the latest live cache on OpenRS2...");
  const response = await fetch(OPENRS2_CACHES_URL);
  if (!response.ok) {
    throw new Error(`OpenRS2 caches.json returned ${response.status}`);
  }
  const caches: Array<{
    id: number;
    scope: string;
    game: string;
    environment: string;
    language: string;
    timestamp: string | null;
    disk_store_valid: boolean;
  }> = await response.json();

  const latest = caches
    .filter(
      (c) =>
        c.game === "oldschool" &&
        c.environment === "live" &&
        c.language === "en" &&
        c.disk_store_valid &&
        c.timestamp,
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime(),
    )[0];
  if (!latest) {
    throw new Error("No valid live oldschool cache found on OpenRS2.");
  }
  console.log(`Using cache ${latest.id} (${latest.timestamp})`);

  rmSync(WORK_DIR, { recursive: true, force: true });
  mkdirSync(WORK_DIR, { recursive: true });

  const zipPath = path.join(WORK_DIR, "disk.zip");
  const downloadUrl = `https://archive.openrs2.org/caches/${latest.scope}/${latest.id}/disk.zip`;
  console.log(`Downloading ${downloadUrl}...`);
  const download = await fetch(downloadUrl);
  if (!download.ok || !download.body) {
    throw new Error(`Cache download returned ${download.status}`);
  }
  await pipeline(
    Readable.fromWeb(download.body as never),
    createWriteStream(zipPath),
  );

  execFileSync("unzip", ["-o", "-q", zipPath, "-d", WORK_DIR]);
  const cacheDir = path.join(WORK_DIR, "cache");
  if (!existsSync(path.join(cacheDir, "main_file_cache.dat2"))) {
    throw new Error(`Extracted cache not found at ${cacheDir}`);
  }

  const outDir = path.join(WORK_DIR, "icons");
  console.log("Rendering item icons (takes ~10-15 minutes)...");
  execFileSync(
    process.platform === "win32" ? "gradlew.bat" : "./gradlew",
    [
      "--no-daemon",
      "-q",
      "run",
      `--args=${cacheDir} ${outDir} ${path.join(RENDERER_DIR, "quantities.json")}`,
    ],
    { cwd: RENDERER_DIR, stdio: "inherit" },
  );

  return outDir;
}

async function listExistingIcons(): Promise<Map<number, string>> {
  const icons = new Map<number, string>();
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
      if (match && object.ETag) {
        icons.set(Number(match[1]), object.ETag.replaceAll('"', ""));
      }
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
  return icons;
}
