import { Canvas, useFrame } from "@react-three/fiber";
import { SheetIcon, SidebarCloseIcon, SidebarOpenIcon } from "lucide-react";
import { useRef, useState } from "react";
import React from "react";
import { BufferGeometry, Material, Mesh, MeshStandardMaterial } from "three";
// @ts-ignore
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

import { AccountType } from "@runeprofile/runescape";

import AccountTypeIcons from "~/assets/account-type-icons.json";
import HiscoresIcon from "~/assets/icons/hiscores.png";
import { Button } from "~/components/ui/button";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger,
// } from "~/components/ui/tooltip";
import { base64ImgSrc, formatDate } from "~/lib/utils";

import { Card } from "./card";

type PlayerDisplayProps = {
  username: string;
  accountType: AccountType;
  createdAt: Date;
  updatedAt: Date;
};

const defaultModel =
  "https://runeprofile-api.reinhardt.workers.dev/profiles/models/_default";

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
        <PlayerModel
          modelUri={`${import.meta.env.VITE_API_URL}/profiles/models/${username}`}
        />
      </div>
    </Card>
  );
}

export function PlayerModel({ modelUri }: { modelUri: string }) {
  return (
    <Canvas>
      <Model modelUri={modelUri} />
    </Canvas>
  );
}

const Model = React.memo(({ modelUri }: { modelUri: string }) => {
  const mesh = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const [object, setObject] =
    useState<Mesh<BufferGeometry, MeshStandardMaterial>>();

  React.useEffect(() => {
    loadPLYWithFallback(
      modelUri,
      defaultModel,
      (geometry: BufferGeometry) => {
        geometry.computeVertexNormals();

        const material = new MeshStandardMaterial({
          vertexColors: true,
        });

        const m = new Mesh(geometry, material);
        m.rotateX(-1.55);
        m.rotateZ(0.1);

        setObject(m);
      },
      (error: Error) => {
        console.error("Failed to load PLY model:", error);
      },
    );
  }, [modelUri]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = Math.sin(clock.getElapsedTime());
  });

  return (
    <>
      {object && (
        <>
          <ambientLight intensity={4} />
          <mesh ref={mesh} scale={0.028} position={[0, -3, 0]}>
            <primitive object={object} />
          </mesh>
        </>
      )}
    </>
  );
});

function loadPLYWithFallback(
  primaryURI: string,
  backupURI: string,
  onLoadCallback: (geometry: BufferGeometry) => void,
  onErrorCallback: (error: Error) => void,
) {
  const loader = new PLYLoader();

  const attemptLoad = (uri: string) => {
    return new Promise<BufferGeometry>((resolve, reject) => {
      loader.load(uri, resolve, null, reject);
    });
  };

  attemptLoad(primaryURI)
    .then(onLoadCallback)
    .catch(() => {
      attemptLoad(backupURI).then(onLoadCallback).catch(onErrorCallback);
    });
}
