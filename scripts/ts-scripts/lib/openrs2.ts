import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

// The OpenRS2 archive (https://archive.openrs2.org) mirrors every OSRS cache
// straight from Jagex's JS5 servers, within minutes of a game update - the
// canonical source all the data-sync and icon-sync scripts run against.

const OPENRS2_CACHES_URL = "https://archive.openrs2.org/caches.json";

export type Openrs2Cache = {
  id: number;
  scope: string;
  timestamp: string;
};

export async function resolveLatestCache(): Promise<Openrs2Cache> {
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
  return { id: latest.id, scope: latest.scope, timestamp: latest.timestamp! };
}

// Downloads and extracts a cache's disk store into destDir; returns the
// directory containing main_file_cache.dat2 (+ .idx files).
export async function downloadCache(
  cache: Openrs2Cache,
  destDir: string,
): Promise<string> {
  rmSync(destDir, { recursive: true, force: true });
  mkdirSync(destDir, { recursive: true });

  const zipPath = path.join(destDir, "disk.zip");
  const downloadUrl = `https://archive.openrs2.org/caches/${cache.scope}/${cache.id}/disk.zip`;
  console.log(`Downloading ${downloadUrl}...`);
  const download = await fetch(downloadUrl);
  if (!download.ok || !download.body) {
    throw new Error(`Cache download returned ${download.status}`);
  }
  await pipeline(
    Readable.fromWeb(download.body as never),
    createWriteStream(zipPath),
  );

  execFileSync("unzip", ["-o", "-q", zipPath, "-d", destDir]);
  const cacheDir = path.join(destDir, "cache");
  if (!existsSync(path.join(cacheDir, "main_file_cache.dat2"))) {
    throw new Error(`Extracted cache not found at ${cacheDir}`);
  }
  return cacheDir;
}
