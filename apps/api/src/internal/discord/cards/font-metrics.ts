/**
 * Text measurement for the card layout.
 *
 * The card has a fixed height and a narrow content column, so the layout
 * has to know how wide a string will come out *before* handing it to
 * satori: too wide and it wraps, and a wrapped line is what pushed the
 * player's name off the top of the card.
 *
 * The widths are read out of the very font the card renders with, rather
 * than kept alongside it as a table, so the two cannot drift apart when
 * the font is replaced.
 */

/** Advance widths per character, as a fraction of the font size. */
type FontWidths = {
  widths: Map<number, number>;
  /** Advance of the glyph a missing character falls back to. */
  missing: number;
};

/**
 * Reads the advance widths out of a TrueType font: the `hmtx` table holds
 * them per glyph, `cmap` maps characters to glyphs, and `head` gives the
 * em size everything is expressed in.
 *
 * Only cmap format 4 is handled, which is the format a modern font uses
 * for the Basic Multilingual Plane. A font without one measures as all
 * missing glyphs, which the fitting treats as a very wide string - it
 * shrinks the text rather than overflowing the card.
 */
function readFontWidths(font: Uint8Array): FontWidths {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const u16 = (at: number) => view.getUint16(at);
  const i16 = (at: number) => view.getInt16(at);
  const u32 = (at: number) => view.getUint32(at);

  const tables = new Map<string, number>();
  const numTables = u16(4);
  for (let i = 0; i < numTables; i++) {
    const record = 12 + i * 16;
    const tag = String.fromCharCode(
      view.getUint8(record),
      view.getUint8(record + 1),
      view.getUint8(record + 2),
      view.getUint8(record + 3),
    );
    tables.set(tag, u32(record + 8));
  }

  const head = tables.get("head");
  const hhea = tables.get("hhea");
  const hmtx = tables.get("hmtx");
  const cmap = tables.get("cmap");
  if (!head || !hhea || !hmtx || !cmap) {
    return { widths: new Map(), missing: 0.5 };
  }

  const unitsPerEm = u16(head + 18) || 1000;
  const hMetrics = u16(hhea + 34);
  // Past the last full metric every glyph repeats the last advance.
  const advance = (glyph: number) =>
    u16(hmtx + Math.min(glyph, hMetrics - 1) * 4) / unitsPerEm;

  // Prefer a Windows Unicode subtable, then any Unicode one.
  let best: { at: number; score: number } | null = null;
  const subtables = u16(cmap + 2);
  for (let i = 0; i < subtables; i++) {
    const record = cmap + 4 + i * 8;
    const platform = u16(record);
    const encoding = u16(record + 2);
    const score = platform === 3 && encoding === 1 ? 3 : platform === 0 ? 2 : 1;
    if (!best || score > best.score) {
      best = { at: cmap + u32(record + 4), score };
    }
  }

  const widths = new Map<number, number>();
  if (best && u16(best.at) === 4) {
    const at = best.at;
    const segments = u16(at + 6) / 2;
    const endsAt = at + 14;
    const startsAt = endsAt + segments * 2 + 2;
    const deltasAt = startsAt + segments * 2;
    const rangesAt = deltasAt + segments * 2;

    for (let s = 0; s < segments; s++) {
      const end = u16(endsAt + s * 2);
      const start = u16(startsAt + s * 2);
      const delta = i16(deltasAt + s * 2);
      const rangeOffset = u16(rangesAt + s * 2);
      if (start === 0xffff) continue;

      for (let code = start; code <= end && code !== 0xffff; code++) {
        let glyph: number;
        if (rangeOffset === 0) {
          glyph = (code + delta) & 0xffff;
        } else {
          const at = rangesAt + s * 2 + rangeOffset + (code - start) * 2;
          if (at + 1 >= font.byteLength) continue;
          glyph = u16(at);
          if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
        }
        if (glyph !== 0) widths.set(code, advance(glyph));
      }
    }
  }

  return { widths, missing: advance(0) };
}

let cache: { regular: FontWidths; bold: FontWidths } | null = null;

/** Both faces, parsed once per isolate. */
export function initFontMetrics(fonts: {
  regular: Uint8Array;
  bold: Uint8Array;
}) {
  cache ??= {
    regular: readFontWidths(fonts.regular),
    bold: readFontWidths(fonts.bold),
  };
  return cache;
}

/**
 * Width of a string at a given font size, in the same units the size is
 * given in. Bold and regular have their own metrics: the bold face is
 * wider, and measuring a bold title against regular widths would let it
 * wrap.
 */
export function measureText(
  text: string,
  weight: "regular" | "bold",
  size: number,
): number {
  if (!cache) return text.length * 0.5 * size;
  const font = cache[weight];
  let em = 0;
  for (const ch of text) {
    em += font.widths.get(ch.codePointAt(0) ?? 0) ?? font.missing;
  }
  return em * size;
}
