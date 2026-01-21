import { Center } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Info, Pause, Play } from "lucide-react";
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

import { Group, getProfileModels } from "~/core/api";
import AccountTypeIcons from "~/core/assets/account-type-icons.json";
import ClanRankIcons from "~/core/assets/clan-rank-icons.json";
import defaultPlayerModel from "~/core/assets/default-player-model.json";
import { Card } from "~/features/profile/components/card";
import { GameIcon } from "~/shared/components/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/shared/components/ui/popover";
import { Separator } from "~/shared/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/shared/components/ui/tooltip";
import {
  formatDate,
  formatRelativeTime,
  loadModelFromBase64,
} from "~/shared/utils";

export const isAnimatingAtom = atomWithStorage<boolean>(
  "character-animation",
  true,
);

type Profile = {
  username: string;
  accountType: AccountType;
  clan: {
    name: string;
    rank: number;
    icon: number;
    title: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

type PlayerDisplayProps = Profile & {
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
  const [isAnimating, setIsAnimating] = useAtom(isAnimatingAtom);

  return (
    <Card className="flex max-w-[260px] flex-col 1.5xl:min-h-[730px] 1.5xl:min-w-[400px] relative overflow-visible">
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

      {/* Bottom left controls */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-y-1">
        {/* Play/Pause button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="bg-background/80 border border-border rounded-md p-1 hover:border-primary transition-colors cursor-pointer"
            >
              {isAnimating ? (
                <Pause className="text-osrs-orange size-4" />
              ) : (
                <Play className="text-osrs-orange size-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isAnimating ? "Pause animation" : "Play animation"}
          </TooltipContent>
        </Tooltip>

        {/* Info icon with timestamps */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="bg-background/80 border border-border rounded-md p-1 hover:border-primary transition-colors cursor-pointer">
              <Info className="text-osrs-orange size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-2.5 flex flex-col w-[260px]" side="top">
            <div className="flex flex-row items-center justify-between text-sm">
              <span className="font-semibold text-foreground">Created</span>
              <span className="font-semibold text-secondary-foreground">
                {formatDate(createdAt)}
              </span>
            </div>
            <Separator className="my-1" />
            <div className="flex flex-row items-center justify-between text-sm">
              <span className="font-semibold text-foreground">Updated</span>
              <span className="font-semibold text-secondary-foreground">
                {formatRelativeTime(updatedAt)}
              </span>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Model */}
      <div className="h-full p-[1px] relative">
        <PlayerModel username={username} isAnimating={isAnimating} />
      </div>
    </Card>
  );
}

export function PlayerModel({
  username,
  isAnimating,
}: {
  username: string;
  isAnimating: boolean;
}) {
  return (
    <Canvas
      gl={{
        alpha: true,
      }}
      flat
    >
      <Model username={username} isAnimating={isAnimating} />
    </Canvas>
  );
}

const Model = React.memo(
  ({ username, isAnimating }: { username: string; isAnimating: boolean }) => {
    const playerMeshRef =
      useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
    const petMeshRef =
      useRef<Mesh<BufferGeometry, Material | Material[]>>(null);

    const [playerGeometry, setPlayerGeometry] = useState<BufferGeometry>();
    const [petGeometry, setPetGeometry] = useState<BufferGeometry>();

    const animationTimeRef = useRef(0);

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

    useFrame((_, delta) => {
      if (!playerMeshRef.current) return;

      if (isAnimating) {
        animationTimeRef.current += delta;
      }

      const y = Math.sin(animationTimeRef.current);
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
            <Model3D
              geometry={playerGeometry}
              material={material}
              position={playerPosition}
              rotation={initialModelRotation}
              scale={modelScale}
              showShadow
              shadowTexture={shadowTexture}
              shadowPosition={[0, -3.01, 0]}
              meshRef={playerMeshRef}
            />

            {petGeometry && (
              <Model3D
                geometry={petGeometry}
                material={material}
                position={petPosition}
                rotation={initialModelRotation}
                scale={modelScale}
                showShadow
                shadowTexture={shadowTexture}
                shadowPosition={[2.5, -3.31, -3]}
                meshRef={petMeshRef}
              />
            )}
          </group>
        )}
      </Center>
    );
  },
);

type Model3DProps = {
  geometry: BufferGeometry;
  material: MeshBasicMaterial;
  position: readonly [number, number, number];
  rotation: Euler;
  scale: number;
  showShadow?: boolean;
  shadowTexture?: CanvasTexture;
  shadowPosition?: [number, number, number];
  meshRef?: React.RefObject<Mesh<BufferGeometry, Material | Material[]> | null>;
};

function Model3D({
  geometry,
  material,
  position,
  rotation,
  scale,
  showShadow,
  shadowTexture,
  shadowPosition,
  meshRef,
}: Model3DProps) {
  return (
    <>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        scale={scale}
        position={position}
        rotation={rotation}
      />

      {showShadow && shadowTexture && shadowPosition && (
        <mesh rotation-x={-Math.PI / 2} position={shadowPosition} scale={1.4}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial map={shadowTexture} transparent />
        </mesh>
      )}
    </>
  );
}

export function GroupCharacters({ members }: { members: Group["members"] }) {
  const [loading, setLoading] = useState(true);
  const [geometries, setGeometries] = useState<
    Map<string, BufferGeometry | null>
  >(new Map());

  const material = React.useMemo(
    () => new MeshBasicMaterial({ vertexColors: true }),
    [],
  );

  const initialModelRotation = React.useMemo(
    () => new Euler(-1.55, 0, 0.1),
    [],
  );

  const shadowTexture = React.useMemo(() => createRadialTexture(), []);

  React.useEffect(() => {
    setLoading(true);
    setGeometries(new Map());

    const loadAllModels = async () => {
      const promises = members.map(async (member) => {
        try {
          const models = await getProfileModels({
            username: member.username,
            includePet: false,
          });
          const geometry = await loadModelFromBase64(models.playerModelBase64);
          return { username: member.username, geometry };
        } catch (error) {
          console.error(
            `Error loading model for ${member.username} - falling back to default model.`,
            error,
          );
          try {
            const geometry = await loadModelFromBase64(
              defaultPlayerModel.base64,
            );
            return { username: member.username, geometry };
          } catch {
            return { username: member.username, geometry: null };
          }
        }
      });

      const results = await Promise.all(promises);
      const newGeometries = new Map<string, BufferGeometry | null>();
      results.forEach(({ username, geometry }) => {
        newGeometries.set(username, geometry);
      });

      setGeometries(newGeometries);
      setLoading(false);
    };

    loadAllModels();
  }, [members]);

  const modelScale = 0.028;
  const memberCount = members.length;

  return (
    <div className="relative w-full h-full">
      {/* Labels positioned absolutely above the canvas */}
      {!loading && (
        <div className="absolute inset-x-0 top-4 z-20 flex justify-center gap-x-6">
          {members.map((member, index) => {
            const accountTypeIcon =
              AccountTypeIcons[
                member.accountType.key as keyof typeof AccountTypeIcons
              ];

            // Calculate horizontal position to align with character model
            // Each character takes up space proportional to memberCount
            const centerOffset = index - (memberCount - 1) / 2;
            const percentageOffset =
              (centerOffset / Math.max(memberCount, 1)) * 40;

            return (
              <Link
                key={member.username}
                to="/$username"
                params={{ username: member.username }}
                style={{
                  transform: `translateX(${percentageOffset}%)`,
                }}
                className="flex items-center space-x-1.5 font-runescape text-lg font-bold solid-text-shadow hover:underline cursor-pointer bg-background/80 px-3 py-1.5 rounded-md border border-border whitespace-nowrap"
              >
                {!!accountTypeIcon && (
                  <GameIcon
                    src={accountTypeIcon}
                    alt={member.accountType.name}
                    size={18}
                    className="drop-shadow-solid"
                  />
                )}
                <span className="text-osrs-white">{member.username}</span>
              </Link>
            );
          })}
        </div>
      )}

      <Canvas
        gl={{
          alpha: true,
        }}
        flat
      >
        <Center rotateX={Math.PI}>
          {!loading && (
            <group>
              {members.map((member, index) => {
                const geometry = geometries.get(member.username);
                if (!geometry) return null;

                const xPosition = (index - (memberCount - 1) / 2) * 3;
                const position = [xPosition, -3, 0] as const;
                const shadowPosition: [number, number, number] = [
                  xPosition,
                  -3.01,
                  0,
                ];

                return (
                  <group key={member.username}>
                    <Model3D
                      geometry={geometry}
                      material={material}
                      position={position}
                      rotation={initialModelRotation}
                      scale={modelScale}
                      showShadow
                      shadowTexture={shadowTexture}
                      shadowPosition={shadowPosition}
                    />
                  </group>
                );
              })}
            </group>
          )}
        </Center>
      </Canvas>
    </div>
  );
}

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
