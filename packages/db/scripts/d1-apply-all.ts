import { spawnSync } from "node:child_process";

import { dirname, root, targets } from "./constants";

let hadError = false;

for (const t of targets) {
  console.log(`\n==> Applying migrations for ${t.name} ...`);
  const result = spawnSync(
    "pnpm",
    ["wrangler", "d1", "migrations", "apply", "runeprofile-db"],
    {
      cwd: t.cwd,
      stdio: "inherit",
      env: process.env,
    },
  );
  if (result.status !== 0) {
    console.error(`Directory: ${dirname}\nRoot: ${root}`);
    console.error(`Migration failed for ${t.name}. Target dir: ${t.cwd}`);
    hadError = true;
  }
}

if (hadError) process.exit(1);

console.log("\nAll migrations applied.");

