import { Material, Mesh, Object3D, RepeatWrapping, Texture } from "three";

export type ScrollingTexture = {
  texture: Texture;
  /** UV units per second, straight from the exporter. */
  scrollU: number;
  scrollV: number;
};

type RuneProfileExtras = {
  textureId?: number;
  scrollU?: number;
  scrollV?: number;
};

/**
 * Finds the textures the game animates.
 *
 * glTF has no way to say "this texture scrolls", so the exporter writes the
 * rate into the material's extras, which GLTFLoader surfaces as
 * material.userData. An inferno cape's fire, lava and water all come through
 * this way; everything else has no entry and costs nothing.
 *
 * Each texture appears once even if several materials share it, so a texture
 * used twice does not scroll at double speed.
 */
export function collectScrollingTextures(root: Object3D): ScrollingTexture[] {
  const found = new Map<Texture, ScrollingTexture>();

  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }

    const materials: Material[] = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      const extras = material.userData?.runeprofile as
        RuneProfileExtras | undefined;
      if (!extras) {
        continue;
      }

      const scrollU = extras.scrollU ?? 0;
      const scrollV = extras.scrollV ?? 0;
      if (scrollU === 0 && scrollV === 0) {
        continue;
      }

      const texture = (material as { map?: Texture | null }).map;
      if (!texture || found.has(texture)) {
        continue;
      }

      // Scrolling only looks right if the texture tiles; the exporter asks for
      // this in the glTF sampler, but a hand made file might not.
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;

      found.set(texture, { texture, scrollU, scrollV });
    }
  });

  return [...found.values()];
}
