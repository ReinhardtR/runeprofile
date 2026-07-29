import type { ParsedModel } from "./ply";

export type ModelInstance = {
  model: ParsedModel;
  /**
   * Rotation about the model's vertical axis in radians.
   * ~3.49 (200 deg) matches the front three-quarter view used on the site.
   */
  yaw?: number;
  /** Horizontal offset in model units, for placing several models in one scene. */
  offsetX?: number;
  /** Depth offset in model units (positive = closer to the camera). */
  offsetZ?: number;
};

export type RenderOptions = {
  width: number;
  height: number;
  /**
   * Fraction of the scene's height to keep, measured from the top.
   * 1 renders the full model; ~0.48 gives a chest-up portrait.
   */
  cropTop?: number;
  /**
   * What "the top" means for cropTop. "bounds" (default) uses the bounding
   * box, which held weapons and banners can dominate — a chest-up crop of a
   * player wielding a tall scythe frames mostly scythe. "body" estimates
   * the top of the head itself (hat tips and held items excluded) and
   * frames relative to that; everything above still renders into the
   * canvas and is clipped only by its edge.
   */
  cropRef?: "bounds" | "body";
  /**
   * Body-framed only: fraction of the canvas height reserved above the
   * head for overflow (hat tips, weapons, banners) before the canvas edge
   * clips it. Default 0 — the head sits at the padding line.
   */
  headroomTop?: number;
  /** Fraction of the canvas left empty around the scene (default 0.02). */
  padding?: number;
  /**
   * "contain" (default) scales the scene to fit both axes. "height" fits
   * the vertical crop region only — a tight portrait can then overflow
   * horizontally (shoulders bleeding off a narrow canvas) and is clipped
   * by the canvas edges.
   */
  fit?: "contain" | "height";
  /**
   * Render at N x the requested size and box-downsample, to anti-alias
   * edges. Default 2.
   */
  supersample?: number;
  /**
   * Shift every instance so its lowest point sits on a shared baseline,
   * like a lineup standing on the same floor. Default true. Models keep
   * their own origin when false.
   */
  alignBaseline?: boolean;
  /**
   * Fade the bottom of the image over this fraction of the height
   * (e.g. 0.25). Blends cropped models seamlessly into any background
   * without overlay tricks. Default 0 (no fade).
   */
  fadeBottom?: number;
  /**
   * Opacity the bottom fade lands on at the very edge, 0..1. 0 (default)
   * dissolves fully; ~0.5 keeps the model half-visible at the edge for a
   * gentler cut.
   */
  fadeFloor?: number;
};

const DEFAULT_YAW = 3.49;

/**
 * Renders one or more models into an RGBA buffer (transparent background)
 * using an orthographic projection and a z-buffer - the same unlit
 * vertex-color look as the site's three.js viewer, with no GPU.
 *
 * Model space is Z-up; the camera looks along +Y after yaw is applied.
 */
export function renderScene(
  instances: ModelInstance[],
  options: RenderOptions,
): Uint8ClampedArray {
  const ss = Math.max(1, Math.floor(options.supersample ?? 2));
  const width = options.width * ss;
  const height = options.height * ss;
  const padding = options.padding ?? 0.02;
  const cropTop = options.cropTop ?? 1;

  // Transform every instance into scene space: rotate about the vertical
  // axis, then map to screen coordinates (x right, y up, z toward camera).
  const transformed = instances.map(({ model, yaw, offsetX, offsetZ }) => {
    const angle = yaw ?? DEFAULT_YAW;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const count = model.positions.length / 3;
    let baseZ = 0;
    if (options.alignBaseline ?? true) {
      baseZ = Infinity;
      for (let i = 0; i < count; i++) {
        const z = model.positions[i * 3 + 2]!;
        if (z < baseZ) baseZ = z;
      }
    }
    const pts = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const mx = model.positions[i * 3]!;
      const my = model.positions[i * 3 + 1]!;
      const mz = model.positions[i * 3 + 2]!;
      pts[i * 3] = mx * cos - my * sin + (offsetX ?? 0);
      pts[i * 3 + 1] = mz - baseZ;
      pts[i * 3 + 2] = mx * sin + my * cos + (offsetZ ?? 0);
    }
    return { pts, model };
  });

  let minY = Infinity;
  let maxY = -Infinity;
  for (const { pts } of transformed) {
    for (let i = 0; i < pts.length; i += 3) {
      const y = pts[i + 1]!;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  // The framing anchor: the bounding box top, or the estimated body top
  // (+ a little headroom) when framing relative to the body. Geometry
  // above the anchor still renders — it only stops influencing the scale
  // and placement, and is clipped by the canvas alone.
  const bodyFramed = options.cropRef === "body";
  let topY = maxY;
  let minX = Infinity;
  let maxX = -Infinity;
  if (bodyFramed) {
    // Frame on the bodies alone: held items don't affect scale, position,
    // or centering — they overflow and get clipped by the canvas, so every
    // player's head lands at the same spot at the same size.
    let bodyTop = -Infinity;
    for (const { pts } of transformed) {
      const body = estimateBody(pts);
      if (body.top > bodyTop) bodyTop = body.top;
      if (body.left < minX) minX = body.left;
      if (body.right > maxX) maxX = body.right;
    }
    if (bodyTop > minY) {
      topY = Math.min(maxY, bodyTop + (bodyTop - minY) * 0.03);
    }
  } else {
    for (const { pts } of transformed) {
      for (let i = 0; i < pts.length; i += 3) {
        const x = pts[i]!;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }

  const cropMinY = topY - (topY - minY) * cropTop;

  const padTop = bodyFramed
    ? Math.max(padding, options.headroomTop ?? 0)
    : padding;
  const spanX = maxX - minX || 1;
  const spanY = topY - cropMinY || 1;
  const heightScale = (height * (1 - padTop - padding)) / spanY;
  const scale =
    options.fit === "height"
      ? heightScale
      : Math.min((width * (1 - padding * 2)) / spanX, heightScale);
  const centerX = (minX + maxX) / 2;

  // Body-framed renders pin the head below the reserved headroom so heads
  // stay prominent even when the fit is width-constrained; otherwise the
  // scene rests on the bottom.
  const yBase = bodyFramed
    ? height * padTop + topY * scale
    : height * (1 - padding) + cropMinY * scale;

  const rgba = new Uint8ClampedArray(width * height * 4);
  const zbuf = new Float32Array(width * height).fill(-Infinity);

  for (const { pts, model } of transformed) {
    const { colors, indices } = model;
    for (let f = 0; f < indices.length; f += 3) {
      const ia = indices[f]!;
      const ib = indices[f + 1]!;
      const ic = indices[f + 2]!;

      const ax = width / 2 + (pts[ia * 3]! - centerX) * scale;
      const ay = yBase - pts[ia * 3 + 1]! * scale;
      const az = pts[ia * 3 + 2]!;
      const bx = width / 2 + (pts[ib * 3]! - centerX) * scale;
      const by = yBase - pts[ib * 3 + 1]! * scale;
      const bz = pts[ib * 3 + 2]!;
      const cx = width / 2 + (pts[ic * 3]! - centerX) * scale;
      const cy = yBase - pts[ic * 3 + 1]! * scale;
      const cz = pts[ic * 3 + 2]!;

      const denom = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (Math.abs(denom) < 1e-9) continue;

      const minPx = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
      const maxPx = Math.min(width - 1, Math.ceil(Math.max(ax, bx, cx)));
      const minPy = Math.max(0, Math.floor(Math.min(ay, by, cy)));
      const maxPy = Math.min(height - 1, Math.ceil(Math.max(ay, by, cy)));

      for (let py = minPy; py <= maxPy; py++) {
        for (let px = minPx; px <= maxPx; px++) {
          const x = px + 0.5;
          const y = py + 0.5;
          const l0 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / denom;
          if (l0 < 0) continue;
          const l1 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / denom;
          if (l1 < 0) continue;
          const l2 = 1 - l0 - l1;
          if (l2 < 0) continue;

          const z = l0 * az + l1 * bz + l2 * cz;
          const idx = py * width + px;
          if (z <= zbuf[idx]!) continue;
          zbuf[idx] = z;

          rgba[idx * 4] =
            l0 * colors[ia * 3]! +
            l1 * colors[ib * 3]! +
            l2 * colors[ic * 3]!;
          rgba[idx * 4 + 1] =
            l0 * colors[ia * 3 + 1]! +
            l1 * colors[ib * 3 + 1]! +
            l2 * colors[ic * 3 + 1]!;
          rgba[idx * 4 + 2] =
            l0 * colors[ia * 3 + 2]! +
            l1 * colors[ib * 3 + 2]! +
            l2 * colors[ic * 3 + 2]!;
          rgba[idx * 4 + 3] = 255;
        }
      }
    }
  }

  const out = ss === 1 ? rgba : downsample(rgba, width, height, ss);

  if (options.fadeBottom && options.fadeBottom > 0) {
    const outHeight = options.height;
    const outWidth = options.width;
    const fadeRows = Math.min(
      outHeight,
      Math.round(outHeight * options.fadeBottom),
    );
    const floor = Math.min(1, Math.max(0, options.fadeFloor ?? 0));
    for (let row = 0; row < fadeRows; row++) {
      const y = outHeight - 1 - row;
      // Smoothstep from the floor alpha at the bottom edge up to full.
      const t = row / fadeRows;
      const factor = floor + (1 - floor) * (t * t * (3 - 2 * t));
      for (let x = 0; x < outWidth; x++) {
        const i = (y * outWidth + x) * 4 + 3;
        out[i] = out[i]! * factor;
      }
    }
  }

  return out;
}

type BodyEstimate = {
  /** Top of the head — hat tips and held items excluded. */
  top: number;
  /** Horizontal extent of the body itself, held items excluded. */
  left: number;
  right: number;
};

/**
 * Estimates the extent of a model's body, ignoring anything held that
 * sticks out: weapon blades, banner poles, hat tips. Head and body
 * slices are both dense and wide; protrusions are sparse (poles, blades)
 * or narrow (hat tips). Starting from the densest slice (the torso),
 * walk out until the slices stop looking like body.
 */
function estimateBody(pts: Float32Array): BodyEstimate {
  const count = pts.length / 3;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    const y = pts[i * 3 + 1]!;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxY - minY <= 0) {
    return { top: maxY, left: -Infinity, right: Infinity };
  }

  const BINS = 64;
  const bins = new Uint32Array(BINS);
  const binMinX = new Float32Array(BINS).fill(Infinity);
  const binMaxX = new Float32Array(BINS).fill(-Infinity);
  for (let i = 0; i < count; i++) {
    const t = (pts[i * 3 + 1]! - minY) / (maxY - minY);
    const b = Math.min(BINS - 1, Math.floor(t * BINS));
    bins[b] = bins[b]! + 1;
    const x = pts[i * 3]!;
    if (x < binMinX[b]!) binMinX[b] = x;
    if (x > binMaxX[b]!) binMaxX[b] = x;
  }

  let densest = 0;
  for (let b = 1; b < BINS; b++) {
    if (bins[b]! > bins[densest]!) densest = b;
  }
  const countThreshold = Math.max(4, bins[densest]! * 0.08);
  const widthThreshold = (binMaxX[densest]! - binMinX[densest]!) * 0.22;

  const isBody = (b: number) =>
    bins[b]! >= countThreshold && binMaxX[b]! - binMinX[b]! >= widthThreshold;

  // A single failing slice can be a neck or a gap in a hood — only a
  // sustained run marks the transition from body to protrusion.
  const walk = (dir: 1 | -1): number => {
    let last = densest;
    let failRun = 0;
    for (let b = densest + dir; b >= 0 && b < BINS; b += dir) {
      if (isBody(b)) {
        last = b;
        failRun = 0;
      } else if (++failRun >= 3) {
        break;
      }
    }
    return last;
  };

  const topBin = walk(1);
  const bottomBin = walk(-1);

  // Body width: widest body slice within the contiguous body region.
  // Slices outside it (a banner's cloth above the pole gap) don't count.
  let left = Infinity;
  let right = -Infinity;
  for (let b = bottomBin; b <= topBin; b++) {
    if (!isBody(b)) continue;
    if (binMinX[b]! < left) left = binMinX[b]!;
    if (binMaxX[b]! > right) right = binMaxX[b]!;
  }

  return {
    top: minY + ((topBin + 1) / BINS) * (maxY - minY),
    left,
    right,
  };
}

function downsample(
  src: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  factor: number,
): Uint8ClampedArray {
  const width = srcWidth / factor;
  const height = srcHeight / factor;
  const out = new Uint8ClampedArray(width * height * 4);
  const samples = factor * factor;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < factor; sy++) {
        for (let sx = 0; sx < factor; sx++) {
          const si = ((y * factor + sy) * srcWidth + x * factor + sx) * 4;
          const alpha = src[si + 3]!;
          // Weight colors by alpha so transparent samples don't darken edges.
          r += src[si]! * alpha;
          g += src[si + 1]! * alpha;
          b += src[si + 2]! * alpha;
          a += alpha;
        }
      }
      const di = (y * width + x) * 4;
      if (a > 0) {
        out[di] = r / a;
        out[di + 1] = g / a;
        out[di + 2] = b / a;
        out[di + 3] = a / samples;
      }
    }
  }
  return out;
}
