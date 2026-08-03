import { describe, expect, test } from "vitest";

import {
  MAX_MODEL_BYTES,
  modelContentType,
  modelFileSchema,
} from "~/lib/models/uploads";

const file = (name: string, bytes: number) =>
  new File([new Uint8Array(bytes)], name);

describe("model upload validation", () => {
  test("accepts the format the plugin sends now", () => {
    expect(modelFileSchema.safeParse(file("model.glb", 70_000)).success).toBe(
      true,
    );
  });

  test("still accepts PLY, which older plugins upload", () => {
    expect(modelFileSchema.safeParse(file("model.ply", 70_000)).success).toBe(
      true,
    );
  });

  test("rejects anything else, whatever it contains", () => {
    for (const name of ["model.obj", "model.gltf", "model", "model.glb.zip"]) {
      expect(modelFileSchema.safeParse(file(name, 1000)).success).toBe(false);
    }
  });

  test("rejects an empty file", () => {
    expect(modelFileSchema.safeParse(file("model.glb", 0)).success).toBe(false);
  });

  /**
   * The boundary rather than a round number: an off-by-one here rejects a
   * legitimate sync, and the plugin has no way to tell the user why.
   */
  test("accepts a model exactly at the cap and rejects one byte more", () => {
    expect(
      modelFileSchema.safeParse(file("model.glb", MAX_MODEL_BYTES)).success,
    ).toBe(true);
    expect(
      modelFileSchema.safeParse(file("model.glb", MAX_MODEL_BYTES + 1)).success,
    ).toBe(false);
  });

  /**
   * Real sizes, so the cap is checked against what actually gets uploaded rather
   * than against itself. A geared character with a pet is the biggest normal
   * case; 128 KB is the largest model seen, mid-emote with effect geometry.
   */
  test("leaves room for the models that actually exist", () => {
    for (const bytes of [70_000, 90_000, 128_000, 300_000]) {
      expect(modelFileSchema.safeParse(file("model.glb", bytes)).success).toBe(
        true,
      );
    }
  });
});

describe("recorded content type", () => {
  test("maps each accepted extension", () => {
    expect(modelContentType("model.glb")).toBe("model/gltf-binary");
    expect(modelContentType("model.ply")).toBe("model/ply");
  });

  test("names the pet files the plugin actually sends", () => {
    expect(modelContentType("pet.glb")).toBe("model/gltf-binary");
    expect(modelContentType("pet.ply")).toBe("model/ply");
  });
});
