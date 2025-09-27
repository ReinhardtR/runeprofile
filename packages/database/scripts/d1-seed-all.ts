import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "../../../");

const seedFile = resolve(root, "packages/database/seed.sql");

interface Target {
  name: string;
  cwd: string;
}

const targets: Target[] = [
  { name: "admin", cwd: resolve(root, "apps/admin") },
  { name: "api", cwd: resolve(root, "apps/api") },
];

let hadError = false;

for (const t of targets) {
  console.log(`\n==> Seeding database for ${t.name} ...`);
  const result = spawnSync(
    "pnpm",
    ["wrangler", "d1", "execute", "runeprofile-db", `--file=${seedFile}`],
    {
      cwd: t.cwd,
      stdio: "inherit",
      env: process.env,
    },
  );
  if (result.status !== 0) {
    console.error(`Seed failed for ${t.name}`);
    hadError = true;
  }
}

if (hadError) process.exit(1);

console.log("\nDatabase seeded for all targets.");
