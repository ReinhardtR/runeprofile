/**
 * Slices the stone frame into corner pieces for the OG image, and writes
 * og-frame.json beside the source art.
 *
 * The frame is a 9-slice: decorative corners joined by plain one-pixel
 * edges. Satori has no border-image, so the corners are cut out here and
 * the edges are drawn as lines in the frame's own colour, which is exact
 * because those edges are a single flat tone.
 *
 * This replaces an earlier hand-slicing that had gone wrong: the top-left
 * piece came out fully transparent and the bottom-left piece was the entire
 * frame, so the OG image showed a blank corner, two mismatched marks, and a
 * whole miniature frame squashed into the fourth. The frame art itself only
 * existed inside that file, so it was written back out as og-frame.png to
 * give this a real source.
 *
 * Run with: pnpm tsx scripts/slice-og-frame.ts
 */
import fs from "node:fs";
import path from "node:path";

import { decodePng, encodePng } from "@runeprofile/model-renderer/rasterizer";

/** Size of each decorative corner, in source pixels. */
const CORNER = 9;

const ASSETS = path.join(import.meta.dirname, "../src/core/assets");
const SOURCE = path.join(ASSETS, "card/og-frame.png");
const OUTPUT = path.join(ASSETS, "og-frame.json");

async function main() {
  const frame = await decodePng(new Uint8Array(fs.readFileSync(SOURCE)));
  const { width, height, rgba } = frame;
  console.log(`frame source: ${width}x${height}`);

  const at = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return [rgba[i]!, rgba[i + 1]!, rgba[i + 2]!, rgba[i + 3]!] as const;
  };

  const cut = async (originX: number, originY: number) => {
    const out = new Uint8ClampedArray(CORNER * CORNER * 4);
    for (let y = 0; y < CORNER; y++) {
      for (let x = 0; x < CORNER; x++) {
        const [r, g, b, a] = at(originX + x, originY + y);
        const i = (y * CORNER + x) * 4;
        out[i] = r;
        out[i + 1] = g;
        out[i + 2] = b;
        out[i + 3] = a;
      }
    }
    return Buffer.from(await encodePng(out, CORNER, CORNER)).toString("base64");
  };

  const corners = {
    tl: await cut(0, 0),
    tr: await cut(width - CORNER, 0),
    bl: await cut(0, height - CORNER),
    br: await cut(width - CORNER, height - CORNER),
  };

  // What the frame joins its corners with is a single black outline, which
  // is invisible against a near-black card — the reason the OG image looked
  // like four floating marks. So two tones come out of here: that outline,
  // and the stone the corners themselves are drawn in, which is what the
  // edges get painted with instead.
  const outlineSample = at(Math.floor(width / 2), 0);
  // Stone: the brightest solid pixel of the top-left corner piece, inside
  // the outline.
  let stone: readonly [number, number, number] = [0, 0, 0];
  let brightest = -1;
  for (let y = 1; y < CORNER; y++) {
    for (let x = 1; x < CORNER; x++) {
      const [r, g, b, a] = at(x, y);
      if (a < 200) continue;
      const lum = r + g + b;
      if (lum > brightest) {
        brightest = lum;
        stone = [r, g, b];
      }
    }
  }
  const outline = `rgb(${outlineSample[0]},${outlineSample[1]},${outlineSample[2]})`;
  const edge = `rgb(${stone[0]},${stone[1]},${stone[2]})`;
  console.log(`outline tone: ${outline}  stone tone: ${edge}`);

  fs.writeFileSync(
    OUTPUT,
    `${JSON.stringify({ corner: CORNER, edge, outline, ...corners }, null, 2)}\n`,
  );
  console.log(`wrote ${path.relative(process.cwd(), OUTPUT)}`);
}

void main();
