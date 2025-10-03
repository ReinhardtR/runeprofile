import { dirname as nodeDirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const filename = fileURLToPath(import.meta.url);
export const dirname = nodeDirname(filename);
export const root = resolve(dirname, "../../../");

export const seedFile = resolve(root, "packages/db/seed.sql");

interface Target {
  name: string;
  cwd: string;
}

export const targets: Target[] = [
  { name: "admin", cwd: resolve(root, "apps/admin") },
  { name: "api", cwd: resolve(root, "apps/api") },
];

