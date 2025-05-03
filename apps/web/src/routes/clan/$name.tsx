import { Canvas } from "@react-three/fiber";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ErrorComponentProps,
  Link,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import React from "react";
import { BufferGeometry, Mesh, MeshStandardMaterial } from "three";

import AccountTypeIcons from "~/assets/account-type-icons.json";
import ClanRankIcons from "~/assets/clan-rank-icons.json";
import defaultPlayerModel from "~/assets/default-player-model.json";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { PlayerModel } from "~/components/osrs/character";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getClanMembers, getProfileModels } from "~/lib/api";
import { base64ImgSrc, loadModelFromBase64 } from "~/lib/utils";

function clanQueryOptions(params: { name: string }) {
  return {
    queryKey: ["clan", params],
    queryFn: () => getClanMembers(params),
  };
}

export const Route = createFileRoute("/clan/$name")({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  loader: async ({ params, context }) => {
    return context.queryClient.prefetchQuery(clanQueryOptions(params));
  },
});

function RouteComponent() {
  const params = Route.useParams();

  const { data: clan } = useSuspenseQuery(clanQueryOptions(params));

  return (
    <>
      <Header />
      <div className="container max-w-3xl mx-auto py-8 px-4 relative">
        <div className="flex flex-row">
          <h1 className="text-4xl font-bold text-secondary-foreground flex-1">
            {clan.name}
          </h1>
          <Badge variant="outline" className="text-muted-foreground">
            {clan.members.length} members
          </Badge>
        </div>
        <Separator className="my-4" />
        <div>
          {clan.members.map((member) => {
            const accountTypeIcon =
              AccountTypeIcons[
                member.accountType.key as keyof typeof AccountTypeIcons
              ];

            return (
              <Link
                to="/$username"
                params={{ username: member.username }}
                key={member.username}
                className="pt-8 overflow-hidden flex flex-row relative transform transition-transform hover:scale-105"
              >
                <div className="bg-card border rounded-md p-4 flex flex-row items-center gap-x-2 flex-1">
                  <img
                    src={base64ImgSrc(
                      ClanRankIcons[
                        String(member.clan.icon) as keyof typeof ClanRankIcons
                      ],
                    )}
                    width={16}
                    height={16}
                    className="drop-shadow-solid-sm"
                  />
                  {!!accountTypeIcon && (
                    <img
                      src={base64ImgSrc(accountTypeIcon)}
                      alt={member.accountType.name}
                      width={18}
                      height={18}
                      className="drop-shadow-solid text-xs"
                    />
                  )}
                  <span className="font-bold text-xl font-runescape solid-text-shadow">
                    {member.username}
                  </span>
                </div>
                <div className="absolute right-4 -top-4 w-24 flex flex-row items-center">
                  <PlayerModelHead username={member.username} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}

const PlayerModelHead = React.memo(({ username }: { username: string }) => {
  const [playerObject, setPlayerObject] =
    React.useState<Mesh<BufferGeometry, MeshStandardMaterial>>();

  React.useEffect(() => {
    const createMesh = (geometry: BufferGeometry) => {
      geometry.computeVertexNormals();
      const material = new MeshStandardMaterial({
        vertexColors: true,
      });
      const m = new Mesh(geometry, material);
      m.rotateX(-1.45);
      m.rotateZ(-0.4);
      return m;
    };

    // Clear previous models
    setPlayerObject(undefined);

    getProfileModels({ username, includePet: false })
      .then((models) => {
        loadModelFromBase64(models.playerModelBase64).then((geometry) =>
          setPlayerObject(createMesh(geometry)),
        );
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
  return (
    <Canvas>
      <ambientLight intensity={3.8} />
      {playerObject && (
        <mesh castShadow scale={0.05} position={[0, -8, 0]}>
          <primitive object={playerObject} />
        </mesh>
      )}
    </Canvas>
  );
});

function ErrorComponent(props: ErrorComponentProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-y-4 items-center justify-center min-h-screen">
      <p className="text-2xl text-primary-foreground">{props.error.message}</p>
      <Button onClick={() => navigate({ to: "/" })}>Home Teleport</Button>
      <Button variant="ghost" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  );
}
