import { BufferGeometry, Material, Mesh, Object3D } from "three";

/**
 * Nudges higher priority faces towards the camera, in view space.
 *
 * The game paints faces in face-render-priority order rather than depth testing
 * them, so an overlay can sit *inside* the thing it decorates and still be drawn
 * over it - a necklace embedded a couple of units in a chestplate is the case
 * this exists for. A depth buffer hides it; the game shows it in full.
 *
 * Reproducing the ordering exactly means painting the whole model in priority
 * strata with depth writes disabled, which is what the client does. This is the
 * cheaper approximation the client itself relies on everywhere else: its face
 * bias adds a small offset to the projected depth, pulling a face forward by a
 * bounded amount rather than letting it win outright.
 *
 * Three earlier attempts got this wrong in ways worth recording.
 *
 * Polygon offset works in depth *buffer* units, which are non-linear and depend
 * on the frustum, so a constant there means an unpredictable distance. View
 * space is world units, so the knob below is simply "wins by up to N game
 * units".
 *
 * Ordering strictly by priority with no depth test drew a weapon through the
 * character. Priority only outranks depth *between* strata; within one, faces
 * are still drawn far to near. Nudging keeps the depth test, so that ordering
 * survives.
 *
 * Applying the nudge per material reached opaque geometry only, because
 * translucent faces are deliberately merged into one mesh and so cannot carry a
 * per material priority. Opaque geometry crept forward relative to translucent
 * geometry that had not moved, and an arm appeared through a crystal shield.
 * Hence per vertex: the exporter writes priority as a vertex attribute, so it
 * splits nothing and reaches everything.
 */

/**
 * How far each step of priority pulls a face forward, in game units.
 *
 * Tuned by eye against a necklace worn under a chestplate, comparing with the
 * same character in game. Below about 2 the necklace stays buried; by 5 the
 * cape starts creeping around the hips.
 *
 * The window is real but not wide, because it is bounded on both sides: the
 * overlap being bridged is a few units, while genuinely separated geometry - a
 * cape against a torso - is 15 or more and must never be reordered.
 */
const STEP_GAME_UNITS = 3;

/**
 * Priorities run 0..11, but the spread is capped so the extremes cannot add up
 * to something that competes with genuinely separated geometry.
 */
const MAX_STEPS = 6;

/** Models are exported in game units and scaled by this on the root node. */
const GAME_UNITS_PER_WORLD_UNIT = 128;

/** What GLTFLoader names the exporter's _PRIORITY attribute. */
const LOADED_ATTRIBUTE = "_priority";

/** Renamed on load, because a leading underscore is reserved in GLSL. */
const SHADER_ATTRIBUTE = "facePriority";

/**
 * Wires the nudge into every mesh carrying priorities. A model without them is
 * left alone and renders exactly as it did before.
 */
export function applyPriorityOffsets(root: Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    if (!renameAttribute(object.geometry)) {
      return;
    }
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      patch(material);
    }
  });
}

function renameAttribute(geometry: BufferGeometry): boolean {
  const loaded = geometry.getAttribute(LOADED_ATTRIBUTE);
  if (!loaded) {
    return geometry.getAttribute(SHADER_ATTRIBUTE) !== undefined;
  }
  geometry.setAttribute(SHADER_ATTRIBUTE, loaded);
  geometry.deleteAttribute(LOADED_ATTRIBUTE);
  return true;
}

function patch(material: Material): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPriorityStep = {
      value: STEP_GAME_UNITS / GAME_UNITS_PER_WORLD_UNIT,
    };
    shader.uniforms.uPriorityMax = { value: MAX_STEPS };

    // The shader source here is still unresolved, so the projection line only
    // exists as an #include. Replacing the literal line silently matches
    // nothing and the offset never reaches the GPU - expand the chunk instead.
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        [
          "#include <common>",
          `attribute float ${SHADER_ATTRIBUTE};`,
          "uniform float uPriorityStep;",
          "uniform float uPriorityMax;",
        ].join("\n"),
      )
      .replace(
        "#include <project_vertex>",
        [
          "vec4 mvPosition = vec4( transformed, 1.0 );",
          "#ifdef USE_BATCHING",
          "  mvPosition = batchingMatrix * mvPosition;",
          "#endif",
          "#ifdef USE_INSTANCING",
          "  mvPosition = instanceMatrix * mvPosition;",
          "#endif",
          "mvPosition = modelViewMatrix * mvPosition;",
          // View space looks down -Z, so adding moves towards the camera.
          `mvPosition.z += min(${SHADER_ATTRIBUTE}, uPriorityMax) * uPriorityStep;`,
          "gl_Position = projectionMatrix * mvPosition;",
        ].join("\n"),
      );
  };

  // Three keys its program cache on the shader source, which onBeforeCompile
  // has already changed. Without this, materials would reuse whichever compiled
  // first and the attribute would go unread.
  material.customProgramCacheKey = () => "priority-offset";
  material.needsUpdate = true;
}
