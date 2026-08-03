import { readFile, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Connect, Plugin } from "vite";
import { defineConfig } from "vite";

/** Where ::rpmodel writes, unless MODELS_DIR says otherwise. */
const DEFAULT_MODELS_DIR =
  process.env.MODELS_DIR ?? path.join(os.homedir(), ".runelite", "runeprofile", "models");

const MODEL_FILE = /\.(glb|gltf|ply)$/i;

/**
 * Serves the dump directory to the page.
 *
 * A browser cannot read a directory on its own, and the File System Access API
 * means a permission prompt on every reload. Since this tool already runs
 * behind a dev server on localhost, letting that server list and serve the
 * directory is both simpler and survives a refresh, so the newest dump can load
 * on its own the moment the page opens.
 */
function modelsApi(): Plugin {
  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/api/models" && url.pathname !== "/api/model") {
      next();
      return;
    }

    const dir = path.resolve(url.searchParams.get("dir") || DEFAULT_MODELS_DIR);

    try {
      if (url.pathname === "/api/models") {
        const names = (await readdir(dir)).filter((name) => MODEL_FILE.test(name));
        const files = await Promise.all(
          names.map(async (name) => {
            const info = await stat(path.join(dir, name));
            return { name, bytes: info.size, modified: info.mtimeMs };
          }),
        );
        files.sort((a, b) => b.modified - a.modified);

        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ dir, files }));
        return;
      }

      const name = url.searchParams.get("file") ?? "";
      const file = path.resolve(dir, name);
      // Keep a crafted ../ from reaching outside the directory being served.
      if (path.dirname(file) !== dir || !MODEL_FILE.test(file)) {
        res.statusCode = 400;
        res.end("Bad file");
        return;
      }

      res.setHeader("content-type", "application/octet-stream");
      res.end(await readFile(file));
    } catch (error) {
      res.statusCode = 404;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: String(error), dir }));
    }
  };

  return {
    name: "runeprofile-models-api",
    configureServer: (server) => void server.middlewares.use(handler),
    configurePreviewServer: (server) => void server.middlewares.use(handler),
  };
}

export default defineConfig({
  plugins: [modelsApi()],
});
