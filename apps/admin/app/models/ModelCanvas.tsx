"use client";

import { Bounds, Center, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, type Object3D } from "three";

import {
  ModelAnimator,
  disposeModel,
  loadModel,
} from "@runeprofile/model-renderer";

/** Game units per scene unit, so the camera can work in small numbers. */
const GAME_UNITS_PER_UNIT = 128;

export type ModelStats = {
  format: "glb" | "ply";
  bytes: number;
  meshes: number;
  triangles: number;
  materials: number;
  textures: number;
};

/**
 * Renders a model with the same loader the website uses, so what shows here is
 * what a profile shows. Only the camera is different: free orbit rather than the
 * profile card's fixed view.
 */
export function ModelCanvas({
  player,
  pet,
  spin,
  onStats,
}: {
  player: ArrayBuffer;
  pet: ArrayBuffer | null;
  spin: boolean;
  onStats: (stats: { player: ModelStats; pet: ModelStats | null }) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.8, 3.2], fov: 45 }}
      dpr={[1, 2]}
      gl={{ alpha: true }}
      flat
    >
      <Scene player={player} pet={pet} spin={spin} onStats={onStats} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={0.8}
        maxDistance={8}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

/**
 * Tips a model from the exporter's Z-up game units into this scene's Y-up small
 * units. The wrapper's own translation stays free for positioning.
 */
function inSceneSpace(object: Object3D): Group {
  const wrapper = new Group();
  wrapper.rotation.x = -Math.PI / 2;
  wrapper.scale.setScalar(1 / GAME_UNITS_PER_UNIT);
  wrapper.add(object);
  return wrapper;
}

/** Where the pet stands relative to the player, as the profile page places it. */
const PET_OFFSET = [0.7, -0.08, -0.84] as const;

function Scene({
  player,
  pet,
  spin,
  onStats,
}: {
  player: ArrayBuffer;
  pet: ArrayBuffer | null;
  spin: boolean;
  onStats: (stats: { player: ModelStats; pet: ModelStats | null }) => void;
}) {
  const [scene, setScene] = useState<Object3D>();
  const animator = useMemo(() => new ModelAnimator(), []);
  const invalidate = useThree((state) => state.invalidate);
  const spinRef = useRef<Group>(null);

  useEffect(() => {
    let current = true;
    const loaded: Object3D[] = [];

    const build = async () => {
      const [playerModel, petModel] = await Promise.all([
        loadModel(player),
        pet ? loadModel(pet) : null,
      ]);
      if (!current) {
        for (const m of [playerModel, petModel]) if (m) disposeModel(m.object);
        return;
      }

      // Player and pet get their own wrapper, as siblings. The renderer works in
      // the exporter's Z-up game units and the camera here is ordinary Y-up in
      // small units, so each wrapper tips and shrinks its own model - and the
      // pet's offset is then in scene units, the same space the camera uses.
      //
      // Nesting the pet inside the player's wrapper instead makes its scale
      // cancel out and renders it at raw game units, 128 times too large.
      const stage = new Group();

      stage.add(inSceneSpace(playerModel.object));
      loaded.push(playerModel.object);
      animator.track(playerModel.object);

      if (petModel) {
        const petWrapper = inSceneSpace(petModel.object);
        petWrapper.position.set(...PET_OFFSET);
        stage.add(petWrapper);
        loaded.push(petModel.object);
        animator.track(petModel.object);
      }

      setScene(stage);
      onStats({
        player: statsOf(playerModel.object, playerModel.format, player),
        pet: petModel ? statsOf(petModel.object, petModel.format, pet!) : null,
      });
      invalidate();
    };

    build();

    return () => {
      current = false;
      animator.clear();
      loaded.forEach(disposeModel);
    };
  }, [player, pet, animator, invalidate, onStats]);

  useFrame((state, delta) => {
    if (spin && spinRef.current) {
      spinRef.current.rotation.y += delta * 0.5;
    }
    // After the spin, so sorting sees where the geometry ended up this frame.
    animator.update(state.camera, delta);
  });

  if (!scene) return null;

  return (
    // Fitted rather than a fixed camera distance: a character's bounds vary a
    // lot - a pet, emote effects, a skull floating above the head - and anything
    // fixed either clips those or renders the character tiny.
    <Bounds fit clip observe margin={1.2}>
      <Center>
        <group ref={spinRef}>
          <primitive object={scene} />
        </group>
      </Center>
    </Bounds>
  );
}

function statsOf(
  root: Object3D,
  format: "glb" | "ply",
  buffer: ArrayBuffer,
): ModelStats {
  let meshes = 0;
  let triangles = 0;
  const materials = new Set<unknown>();
  const textures = new Set<unknown>();

  root.traverse((object) => {
    const mesh = object as {
      isMesh?: boolean;
      geometry?: {
        getIndex(): { count: number } | null;
        getAttribute(n: string): { count: number } | undefined;
      };
      material?: unknown;
    };
    if (!mesh.isMesh || !mesh.geometry) return;

    meshes++;
    const index = mesh.geometry.getIndex();
    triangles +=
      (index
        ? index.count
        : (mesh.geometry.getAttribute("position")?.count ?? 0)) / 3;

    for (const material of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]) {
      materials.add(material);
      const map = (material as { map?: unknown } | undefined)?.map;
      if (map) textures.add(map);
    }
  });

  return {
    format,
    bytes: buffer.byteLength,
    meshes,
    triangles: Math.round(triangles),
    materials: materials.size,
    textures: textures.size,
  };
}
