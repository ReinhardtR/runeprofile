import { Center } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ClientOnly, Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Info, Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import React from "react";
import { Euler, Object3D } from "three";
import { CanvasTexture } from "three";

import {
  ModelAnimator,
  disposeModel,
  loadModel,
} from "@runeprofile/model-renderer";
import { AccountType } from "@runeprofile/runescape";

import { Group, getProfileModel, getProfilePetModel } from "~/core/api";
import AccountTypeIcons from "~/core/assets/account-type-icons.json";
import ClanRankIcons from "~/core/assets/clan-rank-icons.json";
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
import { loadDefaultModel } from "~/shared/model/default-model";
import { cn, formatDate, formatRelativeTime } from "~/shared/utils";

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
  groupName: string | null;
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
  groupName,
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

      {/* Right side buttons - Group and Clan */}
      {(!!groupName || !!clan) && (
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-y-1">
          {!!groupName && (
            <Link
              to="/group/$name"
              params={{ name: groupName }}
              className="flex flex-row px-4 py-1 gap-x-2 font-runescape font-bold bg-background/80 border border-border rounded-md items-center hover:border-primary hover:bg-background transition-colors group"
            >
              {!!accountTypeIcon && (
                <GameIcon
                  src={accountTypeIcon}
                  alt={accountType.name}
                  size={16}
                  className="drop-shadow-solid-sm"
                />
              )}
              <p className="text-md text-osrs-blue solid-text-shadow group-hover:underline">
                {groupName}
              </p>
            </Link>
          )}

          {!!clan && (
            <Link
              to="/clan/$name"
              params={{ name: clan.name }}
              className="flex flex-row px-4 py-1 gap-x-2 font-runescape font-bold bg-background/80 border border-border rounded-md items-center hover:border-primary hover:bg-background transition-colors group"
            >
              {!!ClanRankIcons[
                String(clan.icon) as keyof typeof ClanRankIcons
              ] && (
                <Tooltip>
                  <TooltipTrigger>
                    <GameIcon
                      src={
                        ClanRankIcons[
                          String(clan.icon) as keyof typeof ClanRankIcons
                        ]
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
              )}
              <p className="text-md text-osrs-orange solid-text-shadow group-hover:underline">
                {clan.name}
              </p>
            </Link>
          )}
        </div>
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

/**
 * Orientation and size that put a model where the card expects it. Shared rather
 * than memoised per component: nothing mutates them, and the turntable spins the
 * object's own rotation instead.
 */
const MODEL_ROTATION = new Euler(-1.55, 0, 0.1);
const MODEL_SCALE = 0.028;

/**
 * How a group is arranged: a shallow arc with the ends set back, each member
 * turned inward so the outer ones angle across the frame.
 *
 * Spacing closes up as the group grows, or five members run off the sides of a
 * card that comfortably holds three.
 */
const GROUP_SPACING = (count: number) =>
  count <= 3 ? 3 : count === 4 ? 2.7 : 2.4;

function groupPlacement(index: number, count: number) {
  const offset = index - (count - 1) / 2;
  return {
    position: [offset * GROUP_SPACING(count), 0, -Math.abs(offset) * 0.35] as [
      number,
      number,
      number,
    ],
    /** Turn about the model's own up axis. */
    spin: -offset * 0.38,
  };
}

/**
 * A fixed camera rather than one fitted to the group.
 *
 * Fitting sizes to total bounds, and a member mid-emote with geometry towering
 * over their head inflates that box - so everyone shrinks and the row slides off
 * centre because of what one person happens to be wearing. A character is about
 * 5.6 units tall at MODEL_SCALE, so this shows roughly 8 units of height.
 */
const GROUP_CAMERA = {
  position: [0, 0, 9.6] as [number, number, number],
  fov: 45,
};

/** Drops the row so feet sit near the bottom of the card rather than the middle. */
const GROUP_GROUND = -2.6;

/** Where a member's name sits, above head height and the same for everyone. */
const GROUP_LABEL_HEIGHT = 6.1;

/**
 * Where a member's label belongs on screen, in pixels within the canvas.
 *
 * Derived from the same placement and camera the models use, so the two cannot
 * drift - the previous version positioned labels by a percentage of the
 * container, which only ever lined up with an evenly spaced row.
 *
 * The labels stay in the DOM rather than going inside the canvas as drei <Html>:
 * a Canvas is its own React reconciler root, so the router's context does not
 * reach into it and <Link> throws.
 *
 * Perspective divide included, because the arc sets the outer members back and
 * they would otherwise sit slightly wide of their character.
 */
function groupLabelOffset(
  index: number,
  count: number,
  size: { width: number; height: number },
) {
  const { position } = groupPlacement(index, count);
  const depth = GROUP_CAMERA.position[2] - position[2];
  const pixelsPerUnit =
    size.height / (2 * depth * Math.tan((GROUP_CAMERA.fov * Math.PI) / 360));

  return {
    left: size.width / 2 + position[0] * pixelsPerUnit,
    top: size.height / 2 - (GROUP_GROUND + GROUP_LABEL_HEIGHT) * pixelsPerUnit,
  };
}

/**
 * Caps the render resolution. Without this the canvas renders at the device
 * pixel ratio, which is 3 on many phones - nine times the pixels of a 1x render,
 * for a small model in a card where the difference is invisible.
 */
const CANVAS_DPR: [number, number] = [1, 2];

/**
 * The soft blob under a character's feet.
 *
 * One texture for the whole page. It is identical every time, so building a
 * canvas and uploading a texture per card was pure waste - a group page of five
 * made five of them. Never disposed, deliberately: it outlives any one card.
 */
let sharedShadowTexture: CanvasTexture | undefined;

function shadowTexture(): CanvasTexture {
  sharedShadowTexture ??= createRadialTexture();
  return sharedShadowTexture;
}

/**
 * Loads a character's model, falling back to the bundled default if anything
 * goes wrong - a profile that has never synced, a network failure, a corrupt
 * file. Returns null only if even the fallback fails to parse.
 */
async function loadPlayerModel(username: string): Promise<Object3D | null> {
  try {
    return (await loadModel(await getProfileModel({ username }))).object;
  } catch (error) {
    console.error(
      `Error loading model for ${username} - falling back to default model.`,
      error,
    );
    try {
      return (await loadDefaultModel()).object;
    } catch {
      return null;
    }
  }
}

/** An animator that stops tracking whatever it held when the scene goes away. */
function useModelAnimator(): ModelAnimator {
  const animator = React.useMemo(() => new ModelAnimator(), []);
  React.useEffect(() => () => animator.clear(), [animator]);
  return animator;
}

// The three.js canvas (and the scene hooks inside it) only work in the
// browser — never render it during SSR.
export function PlayerModel(props: { username: string; isAnimating: boolean }) {
  return (
    <ClientOnly fallback={null}>
      <PlayerModelScene {...props} />
    </ClientOnly>
  );
}

function PlayerModelScene({
  username,
  isAnimating,
}: {
  username: string;
  isAnimating: boolean;
}) {
  return (
    <Canvas
      gl={{ alpha: true }}
      dpr={CANVAS_DPR}
      flat
      // Paused means nothing moves - not the turntable and not the animated
      // textures - so there is no reason to keep redrawing an identical frame.
      // Anything that does change while paused invalidates explicitly.
      frameloop={isAnimating ? "always" : "demand"}
    >
      <Model username={username} isAnimating={isAnimating} />
    </Canvas>
  );
}

const Model = React.memo(
  ({ username, isAnimating }: { username: string; isAnimating: boolean }) => {
    const playerMeshRef = useRef<Object3D>(null);
    const petMeshRef = useRef<Object3D>(null);

    const [playerModel, setPlayerModel] = useState<Object3D>();
    const [petModel, setPetModel] = useState<Object3D>();

    const animationTimeRef = useRef(0);
    const animator = useModelAnimator();
    // Needed because the canvas stops drawing on its own while paused.
    const invalidate = useThree((state) => state.invalidate);

    React.useEffect(() => {
      // A load that finishes after the username has moved on must not replace
      // the model of whoever is on screen now.
      let current = true;
      const loaded: Object3D[] = [];

      const show = (
        object: Object3D | null,
        set: (value: Object3D | undefined) => void,
      ) => {
        if (!object) return;
        if (!current) {
          disposeModel(object);
          return;
        }
        loaded.push(object);
        animator.track(object);
        set(object);
        invalidate();
      };

      setPlayerModel(undefined);
      setPetModel(undefined);
      animator.clear();

      loadPlayerModel(username).then((object) => show(object, setPlayerModel));

      getProfilePetModel({ username })
        .then(async (bytes) => {
          if (!bytes) return;
          show((await loadModel(bytes)).object, setPetModel);
        })
        .catch((error) => {
          // A missing pet is answered 204 and handled above, so reaching here
          // means the pet itself failed. The character still renders.
          console.error(`Error loading pet model for ${username}.`, error);
        });

      return () => {
        current = false;
        animator.clear();
        loaded.forEach(disposeModel);
      };
    }, [username, animator, invalidate]);

    useFrame((state, delta) => {
      if (!playerMeshRef.current) return;

      if (isAnimating) {
        animationTimeRef.current += delta;
      }

      const y = Math.sin(animationTimeRef.current);
      playerMeshRef.current.rotation.z = y;

      if (petMeshRef.current) {
        petMeshRef.current.rotation.z = y / 1.5;
      }

      // After the rotations above, so sorting sees where the geometry actually
      // ended up this frame.
      animator.update(state.camera, isAnimating ? delta : 0);
    });

    const playerPosition = [0, -3, 0] as const;
    const petPosition = [2.5, -3.3, -3] as const;

    return (
      <Center>
        {playerModel && (
          <group>
            <Model3D
              object={playerModel}
              position={playerPosition}
              rotation={MODEL_ROTATION}
              scale={MODEL_SCALE}
              shadowPosition={[0, -3.01, 0]}
              meshRef={playerMeshRef}
            />

            {petModel && (
              <Model3D
                object={petModel}
                position={petPosition}
                rotation={MODEL_ROTATION}
                scale={MODEL_SCALE}
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
  object: Object3D;
  position: readonly [number, number, number];
  rotation: Euler;
  scale: number;
  /** Omit to draw no shadow. */
  shadowPosition?: [number, number, number];
  meshRef?: React.RefObject<Object3D | null>;
};

function Model3D({
  object,
  position,
  rotation,
  scale,
  shadowPosition,
  meshRef,
}: Model3DProps) {
  return (
    <>
      {/* A loaded model is a whole subtree with its own materials, not a single
          geometry, since a GLB splits by texture and by translucency.

          Keyed on the object, because a primitive cannot have its object
          swapped: switching profiles has to mount a new one. */}
      <primitive
        key={object.uuid}
        ref={meshRef}
        object={object}
        scale={scale}
        position={position}
        rotation={rotation}
      />

      {shadowPosition && (
        // Drawn before the models and without writing depth. It is a soft decal
        // on the ground, and a transparent surface that writes depth discards
        // whatever translucent geometry happens to be drawn after it - which for
        // a pet standing on its own glow meant the glow vanishing at whichever
        // angles put the disc first in three's transparent ordering.
        <mesh
          renderOrder={-1}
          rotation-x={-Math.PI / 2}
          position={shadowPosition}
          scale={1.4}
        >
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial
            map={shadowTexture()}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  );
}

export function GroupCharacters(props: { members: Group["members"] }) {
  return (
    <ClientOnly fallback={null}>
      <GroupCharactersScene {...props} />
    </ClientOnly>
  );
}

/**
 * Drives the per-frame model work from inside the canvas, which is the only
 * place useFrame can be called. Sorting is guarded on the view having moved, so
 * a still camera settles to doing nothing after the first frame.
 */
function SceneAnimator({ animator }: { animator: ModelAnimator }) {
  useFrame((state, delta) => animator.update(state.camera, delta));
  return null;
}

function GroupCharactersScene({ members }: { members: Group["members"] }) {
  const [loading, setLoading] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  React.useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry!.contentRect.width,
        height: entry!.contentRect.height,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [models, setModels] = useState<Map<string, Object3D | null>>(new Map());

  const animator = useModelAnimator();

  React.useEffect(() => {
    let current = true;
    const loaded: Object3D[] = [];

    setLoading(true);
    setModels(new Map());
    animator.clear();

    const loadAllModels = async () => {
      // Pets are not shown here, so they are not fetched. Each member's model
      // caches and revalidates on its own now that they are separate requests.
      const results = await Promise.all(
        members.map(async (member) => ({
          username: member.username,
          object: await loadPlayerModel(member.username),
        })),
      );
      if (!current) {
        // The member list changed while these were loading, so nothing here is
        // going on screen.
        results.forEach(({ object }) => object && disposeModel(object));
        return;
      }

      const newModels = new Map<string, Object3D | null>();
      results.forEach(({ username, object }) => {
        newModels.set(username, object);
        if (object) {
          loaded.push(object);
          animator.track(object);
        }
      });

      setModels(newModels);
      setLoading(false);
    };

    loadAllModels();

    return () => {
      current = false;
      animator.clear();
      loaded.forEach(disposeModel);
    };
  }, [members, animator]);

  const memberCount = members.length;

  return (
    <div ref={stage} className="relative w-full h-full">
      {!loading &&
        size &&
        members.map((member, index) => {
          if (!models.get(member.username)) return null;
          const { left, top } = groupLabelOffset(index, memberCount, size);
          const accountTypeIcon =
            AccountTypeIcons[
              member.accountType.key as keyof typeof AccountTypeIcons
            ];

          return (
            <Link
              key={member.username}
              to="/$username"
              params={{ username: member.username }}
              style={{ left, top, transform: "translate(-50%, -50%)" }}
              className="absolute z-20 flex items-center space-x-1.5 font-runescape text-lg font-bold solid-text-shadow hover:underline cursor-pointer bg-background/80 px-3 py-1.5 rounded-md border border-border whitespace-nowrap"
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

      {/* Left drawing continuously: these models do not spin, but a fire cape's
          texture still scrolls, and there is no pause control here. */}
      <Canvas camera={GROUP_CAMERA} gl={{ alpha: true }} dpr={CANVAS_DPR} flat>
        <SceneAnimator animator={animator} />
        {!loading && (
          <group position={[0, GROUP_GROUND, 0]}>
            {members.map((member, index) => {
              const object = models.get(member.username);
              if (!object) return null;

              const { position, spin } = groupPlacement(index, memberCount);

              return (
                <group key={member.username} position={position}>
                  <Model3D
                    object={object}
                    position={[0, 0, 0]}
                    rotation={new Euler(MODEL_ROTATION.x, 0, spin)}
                    scale={MODEL_SCALE}
                    shadowPosition={[0, -0.01, 0]}
                  />
                </group>
              );
            })}
          </group>
        )}
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
