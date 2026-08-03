import {
  Box3,
  Clock,
  Group,
  NoToneMapping,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import {
  DepthSorter,
  type ScrollingTexture,
  collectScrollingTextures,
  disposeModel,
} from "@runeprofile/model-renderer";

import { type LoadedModel } from "./load";

/** A dump is either the character or the pet following them. */
export type ModelRole = "player" | "pet";

/**
 * Where the pet sits relative to the player, in world units.
 *
 * Taken from the profile page, which places the pet at (2.5, -3.3, -3) against
 * a player at (0, -3, 0) with everything scaled by 0.028. Converting through
 * game units to the 1/128 scale a GLB carries gives this, so a pair loaded here
 * stands the way it will on the site.
 */
const PET_OFFSET: [number, number, number] = [0.698, -0.084, -0.837];

export type ViewerStats = {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
};

export type ViewerOptions = {
  canvas: HTMLCanvasElement;
  onStats?: (stats: ViewerStats) => void;
};

/**
 * Renders an exported player, and optionally the pet standing beside them.
 *
 * Four things here are what the profile page needs to reproduce, and each was
 * arrived at by fixing something visibly wrong rather than by preference.
 *
 * It renders on demand. A character is static most of the time, so a permanent
 * requestAnimationFrame loop redraws identical frames forever and costs a phone
 * real battery. The loop draws only when something changed: the camera moved, a
 * model loaded, or an animated texture is mid scroll.
 *
 * Colours are left to the shared renderer, which decodes vertex colours on load
 * so that three's ordinary sRGB output puts the exporter's literal bytes on
 * screen. There used to be a pass-through toggle here that skipped the decode
 * and set a linear output space; it now double counts and is gone. The website
 * does the same thing, which is the point of sharing the loader.
 *
 * Translucent geometry is drawn with depth writes off and its triangles sorted
 * back to front every frame the view changes. Both are required: without
 * sorting a near face hides a farther one, and with depth writes on a
 * translucent surface stops anything behind it drawing at all.
 *
 * Back faces are culled on everything, as the game does. It stops a translucent
 * shell being drawn twice and compounding into near opacity, and stops the two
 * sides of a thin surface flickering against each other as the camera moves.
 *
 * Higher priority faces are nudged towards the camera by a bounded amount, so
 * an overlay sitting inside the armour it decorates still shows. See
 * priority-offset.ts.
 *
 * The frustum is kept tight around the model. Depth precision is spent across
 * the near to far range, and OSRS models stack near coplanar faces constantly,
 * so a wide range shows up as edges flickering while the camera moves.
 */
export class Viewer {
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly clock = new Clock();
  private readonly onStats?: (stats: ViewerStats) => void;
  private readonly resizeObserver: ResizeObserver;

  /** Everything loaded lives under this, so the two can be framed together. */
  private readonly stage = new Group();
  private readonly loaded = new Map<ModelRole, LoadedModel>();
  private scrollingTextures: ScrollingTexture[] = [];
  private depthSorter: DepthSorter | null = null;

  private frameHandle = 0;
  private needsRender = true;
  private animateTextures = true;
  private idleSpin = false;
  private idleSpinTime = 0;
  private orbiting = false;
  private orbitAngle = 0;

  private framesThisSecond = 0;
  private lastStatsAt = 0;

  constructor({ canvas, onStats }: ViewerOptions) {
    this.onStats = onStats;

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    // Retina is worth it up to a point; beyond 2x the cost is real and the
    // difference is not visible at this model's complexity.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = NoToneMapping;
    // Clearing to transparent leaves the background to CSS. That keeps the
    // renderer's colour handling applying to model data only, and matches how
    // the profile page composites the character over its card.
    this.renderer.setClearAlpha(0);

    this.scene = new Scene();
    this.scene.add(this.stage);

    this.camera = new PerspectiveCamera(35, 1, 0.01, 100);
    this.camera.position.set(0, 1, 3);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.addEventListener("change", () => this.invalidate());

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    this.start();

    // Reachable as `viewer` in the browser console; see countSortInversions.
    (window as unknown as { viewer: Viewer }).viewer = this;
  }

  /**
   * Diagnostics: how many translucent triangles are drawn out of order, which
   * should always be zero. Run `viewer.countSortInversions()` in the console
   * from a few angles when transparency looks wrong; a non zero answer means
   * the sort itself is broken rather than the model or the alpha values.
   */
  countSortInversions(): number {
    return this.depthSorter ? this.depthSorter.countInversions(this.camera) : 0;
  }

  /**
   * Sweeps the camera around the model. Draw order problems are hardest to see
   * from a fixed angle and obvious in motion, so this is the quickest way to
   * check ordering really holds.
   */
  setOrbit(enabled: boolean): void {
    this.orbiting = enabled;
    this.invalidate();
  }

  setAnimateTextures(enabled: boolean): void {
    this.animateTextures = enabled;
    this.invalidate();
  }

  /**
   * The sine wobble the site currently applies to the static PLY mesh. Only
   * useful for comparing against the real thing.
   */
  setIdleSpin(enabled: boolean): void {
    this.idleSpin = enabled;
    if (!enabled) {
      this.stage.rotation.y = 0;
      this.idleSpinTime = 0;
    }
    this.invalidate();
  }

  /**
   * Shows a model in one of the two roles, or clears that role with null.
   * A pet is offset to where the profile page puts it relative to the player,
   * so the pair can be checked as they will actually appear.
   */
  setModel(model: LoadedModel | null, role: ModelRole = "player"): void {
    const existing = this.loaded.get(role);
    if (existing) {
      this.stage.remove(existing.scene);
      disposeModel(existing.scene);
      this.loaded.delete(role);
    }

    if (model) {
      if (role === "pet") {
        model.scene.position.set(...PET_OFFSET);
      }
      this.stage.add(model.scene);
      this.loaded.set(role, model);
    }

    this.scrollingTextures = collectScrollingTextures(this.stage);
    const sorter = new DepthSorter(this.stage);
    this.depthSorter = sorter.isEmpty ? null : sorter;

    if (this.loaded.size > 0) {
      this.frameCamera(this.stage);
    }
    this.invalidate();
  }

  /** Points the camera at the model, whatever its size, with a little headroom. */
  frameCamera(target: Object3D): void {
    const bounds = new Box3().setFromObject(target);
    if (bounds.isEmpty()) {
      return;
    }

    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const extent = Math.max(size.x, size.y, size.z);

    const fitDistance =
      (extent / 2 / Math.tan((this.camera.fov * Math.PI) / 360)) * 1.6;

    // Depth precision is spent across the near..far range, so a wide one leaves
    // almost none where the model is and coplanar faces flicker as the camera
    // moves. Bracketing the model tightly keeps the buffer useful; OSRS models
    // stack overlapping faces constantly, so this matters more than usual.
    this.camera.near = Math.max(fitDistance - extent, fitDistance * 0.05);
    this.camera.far = fitDistance + extent * 3;
    this.camera.position.set(center.x, center.y + size.y * 0.05, center.z + fitDistance);
    this.camera.updateProjectionMatrix();

    this.controls.target.copy(center);
    this.controls.update();
    this.invalidate();
  }

  /**
   * Orbits to a fixed angle around the model, keeping the current distance and
   * height. 0 is the front; a model exported by the plugin faces -Z, which is
   * the direction glTF treats as forward.
   */
  setAzimuth(degrees: number): void {
    const target = this.controls.target;
    const offset = this.camera.position.clone().sub(target);
    const radius = Math.hypot(offset.x, offset.z);
    const radians = (degrees * Math.PI) / 180;

    this.camera.position.set(
      target.x + Math.sin(radians) * radius,
      this.camera.position.y,
      target.z + Math.cos(radians) * radius,
    );
    this.camera.lookAt(target);
    this.controls.update();
    this.invalidate();
  }

  /** Marks the next frame as needing a draw. */
  invalidate(): void {
    this.needsRender = true;
  }

  dispose(): void {
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.setModel(null, "player");
    this.setModel(null, "pet");
    this.renderer.dispose();
  }

  private start(): void {
    const tick = () => {
      this.frameHandle = requestAnimationFrame(tick);

      const delta = this.clock.getDelta();
      let animating = false;

      if (this.animateTextures && this.scrollingTextures.length > 0) {
        for (const { texture, scrollU, scrollV } of this.scrollingTextures) {
          // Wrapping keeps the offset small; left to grow it eventually loses
          // float precision and the scroll visibly stutters.
          texture.offset.x = (texture.offset.x + scrollU * delta) % 1;
          texture.offset.y = (texture.offset.y + scrollV * delta) % 1;
        }
        animating = true;
      }

      if (this.orbiting) {
        this.orbitAngle = (this.orbitAngle + delta * 40) % 360;
        this.setAzimuth(this.orbitAngle);
        animating = true;
      }

      if (this.idleSpin) {
        this.idleSpinTime += delta;
        this.stage.rotation.y = Math.sin(this.idleSpinTime);
        animating = true;
      }

      // Damping keeps moving the camera for a moment after the pointer stops.
      if (this.controls.enableDamping) {
        animating = this.controls.update() || animating;
      }

      if (this.needsRender || animating) {
        // Re-sort before drawing, not after, so the frame that made the camera
        // move is already correctly ordered.
        this.depthSorter?.update(this.camera);
        this.needsRender = false;
        this.renderer.render(this.scene, this.camera);
        this.framesThisSecond++;
      }

      this.reportStats();
    };

    this.frameHandle = requestAnimationFrame(tick);
  }

  private reportStats(): void {
    if (!this.onStats) {
      return;
    }

    const now = performance.now();
    if (now - this.lastStatsAt < 500) {
      return;
    }

    const elapsed = (now - this.lastStatsAt) / 1000;
    const info = this.renderer.info;
    this.onStats({
      fps: this.lastStatsAt === 0 ? 0 : Math.round(this.framesThisSecond / elapsed),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length ?? 0,
    });

    this.framesThisSecond = 0;
    this.lastStatsAt = now;
  }

  private resize(): void {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }
}

