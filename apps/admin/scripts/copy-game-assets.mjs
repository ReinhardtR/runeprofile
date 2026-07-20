// Copies the top-level icon JSON files from apps/web into public/game-assets
// and generates a manifest module for the icons pages. Runs before `dev` and
// `build` — the deployed Worker has no filesystem, so these files must ship
// as static assets, and the manifest doubles as the read allowlist.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const adminDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.resolve(adminDir, "../web/src/core/assets");
const destDir = path.join(adminDir, "public/game-assets");
const manifestPath = path.join(adminDir, "lib/generated/game-assets-manifest.json");

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

const manifest = [];
for (const name of fs.readdirSync(srcDir).sort()) {
  if (!name.endsWith(".json")) continue;
  const srcPath = path.join(srcDir, name);
  if (!fs.statSync(srcPath).isFile()) continue;
  const content = fs.readFileSync(srcPath, "utf-8");
  let count;
  try {
    count = Object.keys(JSON.parse(content)).length;
  } catch {
    console.warn(`Skipping ${name}: invalid JSON`);
    continue;
  }
  fs.copyFileSync(srcPath, path.join(destDir, name));
  manifest.push({ name, count, bytes: Buffer.byteLength(content) });
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Copied ${manifest.length} game asset files to public/game-assets`);
