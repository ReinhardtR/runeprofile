import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { BufferGeometry, Material, Mesh, MeshStandardMaterial } from "three";
// @ts-ignore
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

import { AccountType } from "@runeprofile/runescape";

import CombatIcon from "~/assets/skills/combat.png";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { formatDate } from "~/lib/utils";

import { Card } from "../card";

type PlayerDisplayProps = {
  username: string;
  combatLevel: number;
  accountType: AccountType;
  modelUri: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const defaultModel =
  "https://storage.googleapis.com/runeprofile-models/models/_default.ply";

export function Character({
  username,
  combatLevel,
  accountType,
  modelUri,
  createdAt,
  updatedAt,
}: PlayerDisplayProps) {
  return (
    <Card className="flex max-w-[260px] flex-col 1.5xl:min-h-[730px] 1.5xl:min-w-[400px]">
      {/* Name and Combat Level banner */}
      <div className="absolute inset-x-0 z-20 mx-auto flex flex-wrap items-center justify-center space-x-4 p-2 font-runescape text-2xl font-bold leading-none solid-text-shadow">
        <div className="flex items-center space-x-2">
          {accountType.key !== "normal" && (
            <img
              src={
                new URL(
                  `../../assets/account-types/${accountType.name.toLowerCase()}.png`,
                  import.meta.url,
                ).href
              }
              alt={accountType.name}
              width={16}
              height={20}
              className="drop-shadow-solid text-xs"
            />
          )}
          <span className="text-xl text-osrs-white">{username}</span>
        </div>

        <div className="flex items-center justify-center space-x-1 text-osrs-orange">
          <img
            src={CombatIcon}
            alt="Combat Level"
            width={20}
            height={20}
            className="drop-shadow-solid-sm"
          />
          <span className="text-xl">{combatLevel}</span>
        </div>
      </div>

      {/* Model */}
      <div className="h-full p-[1px]">
        <PlayerModel modelUri={modelUri ?? defaultModel} />
      </div>

      {/* Description Container */}
      <div className="absolute bottom-4 left-0 w-full px-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoCircledIcon className="m-1 ml-auto h-6 w-6 text-osrs-orange drop-shadow-solid" />
          </TooltipTrigger>
          <TooltipContent className="flex w-[250px] flex-col space-y-1 font-runescape text-lg">
            <p>
              <span className="font-bold text-osrs-orange">CREATED AT </span>
              <span className="text-light-gray">{formatDate(createdAt)}</span>
            </p>
            <p>
              <span className="font-bold text-osrs-orange">UPDATED AT </span>
              <span className="text-light-gray">{formatDate(updatedAt)}</span>
            </p>
          </TooltipContent>
        </Tooltip>
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

function Model({ modelUri }: { modelUri: string }) {
  const mesh = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const [object, setObject] =
    useState<Mesh<BufferGeometry, MeshStandardMaterial>>();
  const [oldUrl, setOldUrl] = useState<string>();

  if (object == null || oldUrl !== modelUri) {
    // @ts-ignore
    new PLYLoader().load(modelUri, (geometry) => {
      geometry.computeVertexNormals();

      const material = new MeshStandardMaterial({
        vertexColors: true,
      });

      const m = new Mesh(geometry, material);
      m.rotateX(-1.55);
      m.rotateZ(0.1);

      setObject(m);
      setOldUrl(modelUri);
    });
  }

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
}
