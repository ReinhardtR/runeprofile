import { Center } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useRef, useState } from "react";
import React from "react";
import {
  BufferGeometry,
  Euler,
  Material,
  Mesh,
  MeshBasicMaterial,
} from "three";
import { CanvasTexture } from "three";

import { AccountType } from "@runeprofile/runescape";

import { Profile, getProfileModels } from "~/core/api";
import AccountTypeIcons from "~/core/assets/account-type-icons.json";
import ClanRankIcons from "~/core/assets/clan-rank-icons.json";
import defaultPlayerModel from "~/core/assets/default-player-model.json";
import { Card } from "~/features/profile/components/card";
import { GameIcon } from "~/shared/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/shared/components/ui/tooltip";
import { loadModelFromBase64 } from "~/shared/utils";

type PlayerDisplayProps = {
  username: string;
  accountType: AccountType;
  clan: Profile["clan"];
  createdAt: Date;
  updatedAt: Date;
  showPet?: boolean;
};

export function Character({
  username,
  accountType,
  clan,
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
          {!!accountTypeIcon && (
            <GameIcon
              src={accountTypeIcon}
              alt={accountType.name}
              size={18}
              className="drop-shadow-solid text-xs"
            />
          )}
          <p className="text-xl text-osrs-white">{username}</p>
        </div>
      </div>

      {!!clan && (
        <Link
          to="/clan/$name"
          params={{ name: clan.name }}
          className="absolute bottom-4 right-4 left-auto inset-x-0 z-20 flex flex-row px-4 py-1 gap-x-2 font-runescape font-bold bg-background/80 border border-border rounded-md items-center hover:border-primary hover:bg-background transition-colors group"
        >
          <Tooltip>
            <TooltipTrigger>
              <GameIcon
                src={
                  ClanRankIcons[String(clan.icon) as keyof typeof ClanRankIcons]
                }
                alt={clan.title}
                size={16}
                className="drop-shadow-solid-sm"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{clan.title}</p>
            </TooltipContent>
          </Tooltip>
          <p className="text-md text-osrs-orange solid-text-shadow group-hover:underline">
            {clan.name}
          </p>
        </Link>
      )}

      {/* Model */}
      <div className="h-full p-[1px]">
        <PlayerModel username={username} />
      </div>
    </Card>
  );
}

export function PlayerModel({ username }: { username: string }) {
  return (
    <Canvas
      gl={{
        alpha: true,
      }}
      flat
    >
      <Model username={username} />
    </Canvas>
  );
}

const Model = React.memo(({ username }: { username: string }) => {
  const playerMeshRef =
    useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
  const petMeshRef = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);

  const [playerGeometry, setPlayerGeometry] = useState<BufferGeometry>();
  const [petGeometry, setPetGeometry] = useState<BufferGeometry>();

  const material = React.useMemo(
    () => new MeshBasicMaterial({ vertexColors: true }),
    [],
  );

  const initialModelRotation = React.useMemo(
    () => new Euler(-1.55, 0, 0.1),
    [],
  );

  React.useEffect(() => {
    // Clear previous models
    setPlayerGeometry(undefined);
    setPetGeometry(undefined);

    getProfileModels({ username, includePet: true })
      .then((models) => {
        loadModelFromBase64(models.playerModelBase64).then((geometry) =>
          setPlayerGeometry(geometry),
        );

        if (models.petModelBase64) {
          loadModelFromBase64(models.petModelBase64).then((geometry) =>
            setPetGeometry(geometry),
          );
        }
      })
      .catch((error) => {
        console.error(
          "Error loading models - falling back to default model.",
          error,
        );

        loadModelFromBase64(defaultPlayerModel.base64).then((geometry) =>
          setPlayerGeometry(geometry),
        );
      });
  }, [username]);

  useFrame(({ clock }) => {
    if (!playerMeshRef.current) return;
    const y = Math.sin(clock.getElapsedTime());
    playerMeshRef.current.rotation.z = y;

    if (!petMeshRef.current) return;
    petMeshRef.current.rotation.z = y / 1.5;
  });

  const shadowTexture = React.useMemo(() => createRadialTexture(), []);

  const modelScale = 0.028;
  const playerPosition = [0, -3, 0] as const;
  const petPosition = [2.5, -3.3, -3] as const;

  return (
    <Center rotateX={Math.PI}>
      {playerGeometry && (
        <group>
          <mesh
            ref={playerMeshRef}
            geometry={playerGeometry}
            material={material}
            scale={modelScale}
            position={playerPosition}
            rotation={initialModelRotation}
          />

          <mesh rotation-x={-Math.PI / 2} position={[0, -3.01, 0]} scale={1.4}>
            <circleGeometry args={[1, 32]} />
            <meshBasicMaterial map={shadowTexture} transparent />
          </mesh>

          {petGeometry && (
            <>
              <mesh
                ref={petMeshRef}
                geometry={petGeometry}
                material={material}
                scale={modelScale}
                position={petPosition}
                rotation={initialModelRotation}
              />

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
        </group>
      )}
    </Center>
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
