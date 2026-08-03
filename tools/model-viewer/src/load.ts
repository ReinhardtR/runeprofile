import {
  type ModelFormat,
  loadModel as loadRenderedModel,
} from "@runeprofile/model-renderer";
import { Group, Material, Mesh, type MeshBasicMaterial, Object3D, Texture } from "three";

/**
 * Loads a file with the same renderer the website uses, and measures what came
 * out so the panel can show it.
 *
 * The loading itself is deliberately not reimplemented here. This viewer used to
 * have its own copy, the two drifted - it rendered vertex colours pass-through
 * while the site decoded them - and a real colour bug then looked like the two
 * tools merely disagreeing. Whatever shows here is now what a profile shows.
 */
export type LoadedModel = {
  scene: Object3D;
  format: ModelFormat;
  bytes: number;
  loadMs: number;
  meshes: number;
  triangles: number;
  materials: number;
  textures: number;
};

export async function loadModel(file: File): Promise<LoadedModel> {
  const buffer = await file.arrayBuffer();
  const started = performance.now();

  const { object, format } = await loadRenderedModel(buffer);

  return {
    scene: forViewing(object),
    format,
    bytes: buffer.byteLength,
    loadMs: Math.round(performance.now() - started),
    ...summarise(object),
  };
}

/** Game units per unit here, which the camera distances are all sized against. */
const GAME_UNITS_PER_UNIT = 128;

/**
 * Wraps a model for this viewer's scene.
 *
 * The renderer hands back the exporter's own coordinates - Z up, in game units,
 * matching what the website's layout expects. This viewer is plain Y-up three
 * with a camera fitted in small units, so tip and shrink it once on the way in
 * rather than teaching the camera a second convention.
 *
 * The wrapper is what the caller positions, so rotation and scale live here and
 * translation stays free.
 */
function forViewing(object: Object3D): Object3D {
  const scene = new Group();
  scene.rotation.x = -Math.PI / 2;
  scene.scale.setScalar(1 / GAME_UNITS_PER_UNIT);
  scene.add(object);
  return scene;
}

function summarise(
  root: Object3D,
): Pick<LoadedModel, "meshes" | "triangles" | "materials" | "textures"> {
  let meshes = 0;
  let triangles = 0;
  const materials = new Set<Material>();
  const textures = new Set<Texture>();

  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    meshes++;

    const index = object.geometry.getIndex();
    const position = object.geometry.getAttribute("position");
    triangles += (index ? index.count : (position?.count ?? 0)) / 3;

    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      materials.add(material);
      const map = (material as MeshBasicMaterial).map;
      if (map) {
        textures.add(map);
      }
    }
  });

  return {
    meshes,
    triangles: Math.round(triangles),
    materials: materials.size,
    textures: textures.size,
  };
}
