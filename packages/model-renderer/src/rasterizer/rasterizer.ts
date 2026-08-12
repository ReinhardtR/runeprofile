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
   * Body-framed only: what the canvas centers on horizontally. "body"
   * (default) uses the body's width extent, which a held weapon can skew;
   * "head" pins the head to the canvas center so every portrait points
   * the camera at the same spot.
   */
  centerOn?: "body" | "head";
  /**
   * Where the horizontal center lands, as a fraction of canvas width
   * (default 0.5). A portrait on a full-card-width canvas can anchor the
   * head at 1/6 while weapons overflow across the rest instead of being
   * cut at a narrow canvas edge.
   */
  anchorX?: number;
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
  let headCenterX: number | null = null;
  if (bodyFramed) {
    // Frame on the bodies alone: held items don't affect scale, position,
    // or centering — they overflow and get clipped by the canvas, so every
    // player's head lands at the same spot at the same size.
    let bodyTop = -Infinity;
    let headCenterSum = 0;
    for (const { pts, model } of transformed) {
      const body = estimateBody(pts, model.indices);
      if (body.top > bodyTop) bodyTop = body.top;
      if (body.left < minX) minX = body.left;
      if (body.right > maxX) maxX = body.right;
      headCenterSum += body.headCenterX;
    }
    if (bodyTop > minY) {
      // Taken as-is: the estimate is already the shoulder line plus a
      // nominal head, so it carries its own headroom. Clamping it to the
      // bounding box or padding it by a fraction of the model's height
      // would put the framing back under the influence of whatever the
      // player is wearing or holding.
      topY = bodyTop;
    }
    if (options.centerOn === "head" && transformed.length > 0) {
      headCenterX = headCenterSum / transformed.length;
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
  const centerX = headCenterX ?? (minX + maxX) / 2;
  const anchorPx = width * (options.anchorX ?? 0.5);

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

      const ax = anchorPx + (pts[ia * 3]! - centerX) * scale;
      const ay = yBase - pts[ia * 3 + 1]! * scale;
      const az = pts[ia * 3 + 2]!;
      const bx = anchorPx + (pts[ib * 3]! - centerX) * scale;
      const by = yBase - pts[ib * 3 + 1]! * scale;
      const bz = pts[ib * 3 + 2]!;
      const cx = anchorPx + (pts[ic * 3]! - centerX) * scale;
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

export type BodyEstimate = {
  /**
   * Framing top: the player's own head, with hat tips and held gear
   * excluded, placed at a fixed height above the feet so it lands in the
   * same spot for everyone. Tall headgear reaches past it and overflows —
   * see {@link RenderOptions.headroomTop}.
   */
  top: number;
  /** Horizontal extent of the trunk, held items excluded. */
  left: number;
  right: number;
  /** Horizontal center of the head. */
  headCenterX: number;
  /** Height of the detected body above the ground plane. */
  bodyHeight: number;
  /** The ground plane the framing is measured from. */
  feetY: number;
  /** Whether the anatomy was recognised, or the bounding box was used. */
  recognised: boolean;
};

/** Silhouette resolution. Finer than a limb, coarser than modelling noise. */
const CELL = 4;
/**
 * Anything whose horizontal run is thinner than this is not part of a
 * player: sword blades, scythe shafts, banner poles, bow limbs, the tip of
 * a wizard hat. A neck is about 16 units and an arm about 20, so this
 * keeps every real body part.
 */
const MIN_LIMB = 12;
/**
 * Framing height above the feet — where the top of a plain head sits.
 * Every player model is exported from the same skeleton in the same idle
 * stance, so this is a fixed distance rather than a proportion of a
 * particular model: gear changes a silhouette enormously (a scythe
 * doubles the height, a banner doubles it again) but it cannot move the
 * shoulders. Measured across real profiles: bare heads top out at
 * 192-208 and hooded ones reach 230, so framing here puts every head in
 * the same place and lets tall headgear overflow.
 */
const HEAD_TOP = 202;
/** Band the head is looked for in, above the feet. */
const HEAD_BAND_LOW = 150;
const HEAD_BAND_HIGH = 215;
/** Band used for trunk width, above the feet. */
const TRUNK_LOW = 80;
const TRUNK_HIGH = 140;
/**
 * A recognised body must be at least this tall, and its height must be in
 * this ratio of the whole model, or the anatomy above does not apply and
 * the bounding box is used instead.
 */
const MIN_BODY_HEIGHT = 150;

/**
 * Estimates how to frame a model's body, ignoring anything held that
 * sticks out: weapon blades, banner poles, hat tips.
 *
 * Two ideas do the work.
 *
 * The first is to measure silhouette *area* rather than vertex counts.
 * Density is a decoy — tessellation follows how a garment was modelled,
 * so a detailed hood or a texture-split cape outvotes the big flat quads
 * of a torso, and a model's own bounding box is no better because a held
 * scythe or banner owns most of it.
 *
 * The second is that a player is the thick, connected part of that
 * silhouette. Gear attaches through something thin — a shaft, a pole, a
 * string — so thinning the silhouette by {@link MIN_LIMB} severs held
 * items from the body, and the largest surviving component is the player.
 * Width alone cannot tell them apart: a hood or a hat brim is as wide as
 * the trunk it sits on, which is why "the neck is the narrow part" fails
 * on exactly the models it needs to handle.
 *
 * With the body isolated, its feet give a ground plane that gear dangling
 * below cannot shift, and the framing height above that plane is fixed —
 * so every player is framed identically instead of being zoomed by
 * whatever they happen to be wearing.
 */
export function estimateBody(
  pts: Float32Array,
  indices: Uint32Array,
): BodyEstimate {
  const count = pts.length / 3;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = pts[i * 3]!;
    const y = pts[i * 3 + 1]!;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const bounds = (): BodyEstimate => ({
    top: maxY,
    left: minX,
    right: maxX,
    headCenterX: (minX + maxX) / 2,
    bodyHeight: maxY - minY,
    feetY: minY,
    recognised: false,
  });

  if (!(maxY - minY >= MIN_BODY_HEIGHT) || !(maxX > minX)) return bounds();

  const cols = Math.ceil((maxX - minX) / CELL) + 1;
  const rows = Math.ceil((maxY - minY) / CELL) + 1;
  const grid = new Uint8Array(cols * rows);
  for (let t = 0; t < indices.length; t += 3) {
    const ia = indices[t]!;
    const ib = indices[t + 1]!;
    const ic = indices[t + 2]!;
    const ax = (pts[ia * 3]! - minX) / CELL;
    const ay = (pts[ia * 3 + 1]! - minY) / CELL;
    const bx = (pts[ib * 3]! - minX) / CELL;
    const by = (pts[ib * 3 + 1]! - minY) / CELL;
    const cx = (pts[ic * 3]! - minX) / CELL;
    const cy = (pts[ic * 3 + 1]! - minY) / CELL;
    const denom = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(denom) < 1e-9) continue;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const x1 = Math.min(cols - 1, Math.ceil(Math.max(ax, bx, cx)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const y1 = Math.min(rows - 1, Math.ceil(Math.max(ay, by, cy)));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const x = px + 0.5;
        const y = py + 0.5;
        const l0 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / denom;
        if (l0 < 0) continue;
        const l1 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / denom;
        if (l1 < 0) continue;
        if (1 - l0 - l1 < 0) continue;
        grid[py * cols + px] = 1;
      }
    }
  }

  // Thin the silhouette: clear every horizontal run narrower than a limb,
  // which severs held gear from the body it is attached to.
  const minRun = Math.max(1, Math.round(MIN_LIMB / CELL));
  const thick = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    let run = 0;
    for (let c = 0; c <= cols; c++) {
      const filled = c < cols && grid[r * cols + c] === 1;
      if (filled) {
        run++;
        continue;
      }
      if (run >= minRun) {
        for (let k = c - run; k < c; k++) thick[r * cols + k] = 1;
      }
      run = 0;
    }
  }

  // Largest connected component of what survived: the player.
  const label = new Int32Array(cols * rows).fill(-1);
  const stack: number[] = [];
  let bestLabel = -1;
  let bestArea = 0;
  let nextLabel = 0;
  for (let start = 0; start < cols * rows; start++) {
    if (thick[start] !== 1 || label[start] !== -1) continue;
    const id = nextLabel++;
    let area = 0;
    stack.push(start);
    label[start] = id;
    while (stack.length > 0) {
      const cell = stack.pop()!;
      area++;
      const cr = (cell / cols) | 0;
      const cc = cell % cols;
      const push = (nr: number, nc: number) => {
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;
        const n = nr * cols + nc;
        if (thick[n] !== 1 || label[n] !== -1) return;
        label[n] = id;
        stack.push(n);
      };
      push(cr - 1, cc);
      push(cr + 1, cc);
      push(cr, cc - 1);
      push(cr, cc + 1);
    }
    if (area > bestArea) {
      bestArea = area;
      bestLabel = id;
    }
  }
  if (bestLabel < 0) return bounds();

  /** Widest contiguous run of the body in a row: width and center. */
  const bodyRun = (row: number): { width: number; midX: number } => {
    let run = 0;
    let best = 0;
    let start = -1;
    let bestStart = -1;
    for (let c = 0; c < cols; c++) {
      if (label[row * cols + c] === bestLabel) {
        if (run === 0) start = c;
        run++;
        if (run > best) {
          best = run;
          bestStart = start;
        }
      } else {
        run = 0;
      }
    }
    return {
      width: best * CELL,
      midX: bestStart < 0 ? 0 : minX + (bestStart + best / 2) * CELL,
    };
  };

  // The ground plane is the bottom of the model, not the bottom of the
  // body component: thinning removes the legs, which are the narrowest
  // part of a standing player. The plugin exports a character standing on
  // the ground, and gear hangs from the body rather than below the feet —
  // checked against real profiles including a planted banner pole and a
  // grounded bow, whose lowest points sit level with the boots.
  let bodyTopRow = -1;
  for (let r = rows - 1; r >= 0; r--) {
    if (bodyRun(r).width > 0) {
      bodyTopRow = r;
      break;
    }
  }
  const bodyHeight = bodyTopRow < 0 ? 0 : bodyTopRow * CELL;
  if (bodyHeight < MIN_BODY_HEIGHT) return bounds();
  const feetY = minY;

  const rowAt = (heightAboveFeet: number) =>
    Math.min(rows - 1, Math.max(0, Math.round(heightAboveFeet / CELL)));

  // Head center: the median run center across the head band. Median rather
  // than mean so a brim, or a row where a weapon merges into the head's
  // run, cannot drag the camera sideways.
  const headMids: number[] = [];
  for (let r = rowAt(HEAD_BAND_LOW); r <= rowAt(HEAD_BAND_HIGH); r++) {
    const { width, midX } = bodyRun(r);
    if (width > 0) headMids.push(midX);
  }
  headMids.sort((a, b) => a - b);
  const headCenterX =
    headMids.length > 0
      ? headMids[Math.floor(headMids.length / 2)]!
      : (minX + maxX) / 2;

  // Trunk extent, for callers that center on the body instead of the head.
  let left = Infinity;
  let right = -Infinity;
  for (let r = rowAt(TRUNK_LOW); r <= rowAt(TRUNK_HIGH); r++) {
    const { width, midX } = bodyRun(r);
    if (width <= 0) continue;
    if (midX - width / 2 < left) left = midX - width / 2;
    if (midX + width / 2 > right) right = midX + width / 2;
  }
  if (left > right) {
    left = minX;
    right = maxX;
  }

  return {
    top: feetY + HEAD_TOP,
    left,
    right,
    headCenterX,
    bodyHeight,
    feetY,
    recognised: true,
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
