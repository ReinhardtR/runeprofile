/**
 * Minimal PNG encoder (8-bit RGBA, no filtering). The IDAT zlib stream is
 * produced by the standard CompressionStream API, available in Workers,
 * Node >= 18, and modern browsers.
 */
export async function encodePng(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Promise<Uint8Array> {
  // Prefix every scanline with filter byte 0 (none).
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw.set(
      rgba.subarray(y * stride, (y + 1) * stride),
      y * (stride + 1) + 1,
    );
  }

  const compressed = await deflate(raw);

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA

  return concat([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", new Uint8Array(0)),
  ]);
}

/**
 * Minimal PNG decoder, enough to read back what a renderer just produced:
 * 8-bit, non-interlaced, RGB or RGBA. Exists so an image can be rendered
 * larger than it will be shown and then area-averaged down — small text
 * rasterised directly at its final size loses its thin strokes, where the
 * same text drawn big and averaged down keeps them as soft grey.
 */
export async function decodePng(
  data: Uint8Array,
): Promise<{ width: number; height: number; rgba: Uint8ClampedArray }> {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat: Uint8Array[] = [];

  let offset = 8; // skip the signature
  while (offset + 8 <= data.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      data[offset + 4]!,
      data[offset + 5]!,
      data[offset + 6]!,
      data[offset + 7]!,
    );
    const body = data.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      const depth = body[8]!;
      const colorType = body[9]!;
      const interlace = body[12]!;
      if (depth !== 8 || interlace !== 0 || (colorType !== 6 && colorType !== 2)) {
        throw new Error(
          `Unsupported PNG: depth ${depth}, color type ${colorType}, interlace ${interlace}`,
        );
      }
      channels = colorType === 6 ? 4 : 3;
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  if (width === 0 || height === 0) throw new Error("PNG has no IHDR");

  const raw = await inflate(concat(idat));
  const stride = width * channels;
  const rgba = new Uint8ClampedArray(width * height * 4);
  let prior = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!;
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const current = new Uint8Array(line);
    // Undo the per-scanline filter. Byte distance to the pixel on the left
    // is the channel count, per the PNG spec.
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? current[i - channels]! : 0;
      const b = prior[i]!;
      switch (filter) {
        case 0:
          break;
        case 1:
          current[i] = (current[i]! + a) & 0xff;
          break;
        case 2:
          current[i] = (current[i]! + b) & 0xff;
          break;
        case 3:
          current[i] = (current[i]! + ((a + b) >> 1)) & 0xff;
          break;
        case 4: {
          const c = i >= channels ? prior[i - channels]! : 0;
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          current[i] = (current[i]! + pred) & 0xff;
          break;
        }
        default:
          throw new Error(`Unknown PNG filter ${filter}`);
      }
    }
    for (let x = 0; x < width; x++) {
      const s = x * channels;
      const d = (y * width + x) * 4;
      rgba[d] = current[s]!;
      rgba[d + 1] = current[s + 1]!;
      rgba[d + 2] = current[s + 2]!;
      rgba[d + 3] = channels === 4 ? current[s + 3]! : 255;
    }
    prior = current;
  }
  return { width, height, rgba };
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  // "deflate" = zlib-wrapped stream, which is what PNG's IDAT expects.
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

let crcTable: Int32Array | null = null;

function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < data.length; i++) {
    c = crcTable[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}
