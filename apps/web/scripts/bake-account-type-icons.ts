/**
 * Bakes the account type icons into tactile, crisp versions for the OG
 * image, and writes account-type-icons-shadowed.json beside the source.
 *
 * The source art is 13px game sprites. Drawn at 54px the renderer
 * interpolates them into mush, so they are upscaled here with
 * nearest-neighbour instead — whole pixels, no blending — and then given a
 * black rim and a drop shadow so they sit on the background rather than
 * floating on it. The rim and shadow are drawn *after* the upscale, in
 * output pixels, so they stay the weight the name's own shadow is: doing it
 * before means they come out multiplied by the scale factor.
 *
 * Run with: pnpm tsx scripts/bake-account-type-icons.ts
 */
import fs from "node:fs";
import path from "node:path";

import { decodePng, encodePng } from "@runeprofile/model-renderer/rasterizer";

/** Whole-pixel upscale, chosen so 13px art lands near the 54px design size. */
const SCALE = 4;
/** Black outline width, in output pixels, matching the name's rim. */
const RIM = 2;
/** Drop shadow offset, in output pixels, matching the name's shadow. */
const SHADOW = 4;
const SHADOW_ALPHA = 0.9;

const ASSETS = path.join(import.meta.dirname, "../src/core/assets");
const SOURCE = path.join(ASSETS, "account-type-icons.json");
const OUTPUT = path.join(ASSETS, "account-type-icons-shadowed.json");

function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

async function bake(base64: string) {
  const source = await decodePng(base64ToBytes(base64));

  // Room for the rim on every side and the shadow on two.
  const width = source.width * SCALE + RIM * 2 + SHADOW;
  const height = source.height * SCALE + RIM * 2 + SHADOW;
  const out = new Uint8ClampedArray(width * height * 4);

  /** Alpha of the upscaled sprite at an output pixel, offset by the rim. */
  const spriteAlpha = (x: number, y: number): number => {
    const sx = Math.floor((x - RIM) / SCALE);
    const sy = Math.floor((y - RIM) / SCALE);
    if (sx < 0 || sy < 0 || sx >= source.width || sy >= source.height) return 0;
    return source.rgba[(sy * source.width + sx) * 4 + 3]!;
  };

  const put = (x: number, y: number, r: number, g: number, b: number, a: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    // Source-over, so the sprite lands on top of its own rim and shadow.
    const under = out[i + 3]! / 255;
    const over = a;
    const alpha = over + under * (1 - over);
    if (alpha <= 0) return;
    out[i] = (r * over + out[i]! * under * (1 - over)) / alpha;
    out[i + 1] = (g * over + out[i + 1]! * under * (1 - over)) / alpha;
    out[i + 2] = (b * over + out[i + 2]! * under * (1 - over)) / alpha;
    out[i + 3] = alpha * 255;
  };

  // 1. Shadow: the silhouette, offset down-right.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (spriteAlpha(x - SHADOW, y - SHADOW) > 0) put(x, y, 0, 0, 0, SHADOW_ALPHA);
    }
  }
  // 2. Rim: every pixel within RIM of the silhouette, in black.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (spriteAlpha(x, y) > 0) continue;
      let near = false;
      for (let dy = -RIM; dy <= RIM && !near; dy++) {
        for (let dx = -RIM; dx <= RIM && !near; dx++) {
          if (dx * dx + dy * dy > RIM * RIM) continue;
          if (spriteAlpha(x + dx, y + dy) > 0) near = true;
        }
      }
      if (near) put(x, y, 0, 0, 0, 1);
    }
  }
  // 3. The sprite itself, nearest-neighbour.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = Math.floor((x - RIM) / SCALE);
      const sy = Math.floor((y - RIM) / SCALE);
      if (sx < 0 || sy < 0 || sx >= source.width || sy >= source.height) continue;
      const s = (sy * source.width + sx) * 4;
      const alpha = source.rgba[s + 3]! / 255;
      if (alpha <= 0) continue;
      put(x, y, source.rgba[s]!, source.rgba[s + 1]!, source.rgba[s + 2]!, alpha);
    }
  }

  const png = await encodePng(out, width, height);
  return {
    data: Buffer.from(png).toString("base64"),
    width,
    height,
  };
}

async function main() {
  const source = JSON.parse(fs.readFileSync(SOURCE, "utf8")) as Record<string, string>;
  const baked: Record<string, { data: string; width: number; height: number }> = {};
  for (const [key, value] of Object.entries(source)) {
    baked[key] = await bake(value);
    console.log(`${key}: ${baked[key]!.width}x${baked[key]!.height}`);
  }
  fs.writeFileSync(OUTPUT, `${JSON.stringify(baked, null, 2)}\n`);
  console.log(`wrote ${path.relative(process.cwd(), OUTPUT)}`);
}

void main();
