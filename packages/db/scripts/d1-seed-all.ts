import { spawnSync } from "node:child_process";

import { seedFile, targets } from "./constants";

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

