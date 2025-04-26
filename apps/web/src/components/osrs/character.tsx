import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import React from "react";
import { BufferGeometry, Material, Mesh, MeshStandardMaterial } from "three";
import { CanvasTexture } from "three";
// @ts-expect-error
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

import { AccountType } from "@runeprofile/runescape";

import AccountTypeIcons from "~/assets/account-type-icons.json";
import defaultPlayerModel from "~/assets/default-player-model.json";
import { getProfileModels } from "~/lib/api";
import { base64ImgSrc } from "~/lib/utils";

import { Card } from "./card";

type PlayerDisplayProps = {
  username: string;
  accountType: AccountType;
  createdAt: Date;
  updatedAt: Date;
};

export function Character({
  username,
  accountType,
  createdAt,
  updatedAt,
}: PlayerDisplayProps) {
  const accountTypeIcon =
    AccountTypeIcons[accountType.key as keyof typeof AccountTypeIcons];

  return (
    <Card className="flex max-w-[260px] flex-col 1.5xl:min-h-[730px] 1.5xl:min-w-[400px] relative">
      {/* Name and Combat Level banner */}
      <div className="absolute inset-x-0 z-20 mx-auto flex flex-wrap items-center justify-center space-x-4 p-3 font-runescape text-2xl font-bold leading-none solid-text-shadow">
        <div className="flex items-center space-x-2">
          {accountTypeIcon && (
            <img
              src={base64ImgSrc(accountTypeIcon)}
              alt={accountType.name}
              width={20}
              height={20}
              className="drop-shadow-solid text-xs"
            />
          )}
          <span className="text-xl text-osrs-white">{username}</span>
        </div>
      </div>

      {/* Model */}
      <div className="h-full p-[1px]">
        <PlayerModel username={username} />
      </div>
    </Card>
  );
}

export function PlayerModel({ username }: { username: string }) {
  return (
    <Canvas shadows>
      <ambientLight intensity={3.8} />
      <Model username={username} />
    </Canvas>
  );
}

const Model = React.memo(({ username }: { username: string }) => {
  const playerMeshRef =
    useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const petMeshRef = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);

  const [playerObject, setPlayerObject] =
    useState<Mesh<BufferGeometry, MeshStandardMaterial>>();
  const [petObject, setPetObject] =
    useState<Mesh<BufferGeometry, MeshStandardMaterial>>();

  React.useEffect(() => {
    const createMesh = (geometry: BufferGeometry) => {
      geometry.computeVertexNormals();
      const material = new MeshStandardMaterial({
        vertexColors: true,
      });
      const m = new Mesh(geometry, material);
      m.rotateX(-1.55);
      m.rotateZ(0.1);
      return m;
    };

    getProfileModels({ username })
      .then((models) => {
        loadModelFromBase64(models.playerModelBase64).then((geometry) =>
          setPlayerObject(createMesh(geometry)),
        );

        if (models.petModelBase64) {
          loadModelFromBase64(models.petModelBase64).then((geometry) =>
            setPetObject(createMesh(geometry)),
          );
        }
      })
      .catch((error) => {
        console.error(
          "Error loading models - falling back to default model.",
          error,
        );
        loadModelFromBase64(defaultPlayerModel.base64).then((geometry) =>
          setPlayerObject(createMesh(geometry)),
        );
      });
  }, [username]);

  useFrame(({ clock }) => {
    if (!playerMeshRef.current) return;
    const y = Math.sin(clock.getElapsedTime());
    playerMeshRef.current.rotation.y = y;

    if (!petMeshRef.current) return;
    petMeshRef.current.rotation.y = y / 1.5;
  });

  const shadowTexture = React.useMemo(() => createRadialTexture(), []);

  return (
    <>
      {playerObject && (
        <>
          <mesh
            castShadow
            ref={playerMeshRef}
            scale={0.028}
            position={[0, -3, 0]}
          >
            <primitive object={playerObject} />
          </mesh>

          <mesh rotation-x={-Math.PI / 2} position={[0, -3.01, 0]} scale={1.4}>
            <circleGeometry args={[1, 32]} />
            <meshBasicMaterial map={shadowTexture} transparent />
          </mesh>

          {petObject && (
            <>
              <mesh
                castShadow
                ref={petMeshRef}
                scale={0.028}
                position={[2.5, -3.3, -3]}
              >
                <primitive object={petObject} />
              </mesh>

              <mesh
                rotation-x={-Math.PI / 2}
                position={[2.5, -3.31, -3]}
                scale={1.4}
              >
                <circleGeometry args={[1, 32]} />
                <meshBasicMaterial map={shadowTexture} transparent />
              </mesh>
            </>
          )}
        </>
      )}
    </>
  );
});

function createRadialTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );

  gradient.addColorStop(0, "rgba(0,0,0,0.4)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function loadModelFromBase64(base64: string): Promise<BufferGeometry> {
  const loader = new PLYLoader();

  const tryLoad = (base64: string) => {
    const arrayBuffer = base64ToArrayBuffer(base64);
    return loader.parse(arrayBuffer);
  };

  return new Promise((resolve, reject) => {
    try {
      const geometry = tryLoad(base64);
      resolve(geometry);
    } catch (error) {
      console.error("Error loading model:", error);
      reject(error);
    }
  });
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
