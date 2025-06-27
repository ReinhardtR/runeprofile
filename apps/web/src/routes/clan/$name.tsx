import { Canvas } from "@react-three/fiber";
import { debounce, useDebouncedValue } from "@tanstack/react-pacer";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ErrorComponentProps,
  Link,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import React from "react";
import { BufferGeometry, Mesh, MeshStandardMaterial } from "three";
import { z } from "zod";

import AccountTypeIcons from "~/assets/account-type-icons.json";
import ClanRankIcons from "~/assets/clan-rank-icons.json";
import defaultPlayerModel from "~/assets/default-player-model.json";
import { BasicPagination } from "~/components/basic-pagination";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { getClanMembers, getProfileModels } from "~/lib/api";
import { base64ImgSrc, loadModelFromBase64 } from "~/lib/utils";

function clanQueryOptions(params: Parameters<typeof getClanMembers>[0]) {
  return {
    queryKey: ["clan", params],
    queryFn: () => getClanMembers(params),
  };
}

const clanSearchSchema = z.object({
  page: z.coerce.number().gt(0).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/clan/$name")({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  validateSearch: zodValidator(clanSearchSchema),
  loaderDeps: ({ search: { page, q } }) => ({ page, q }),
  loader: ({ params, context, deps }) => {
    return context.queryClient.fetchQuery(
      clanQueryOptions({
        name: params.name,
        page: deps.page,
        query: deps.q,
      }),
    );
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData.name} | RuneProfile`,
      },
    ],
  }),
});

function RouteComponent() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: clan } = useSuspenseQuery(
    clanQueryOptions({
      name: params.name,
      page: search.page,
      query: search.q,
    }),
  );

  const [query, setQuery] = React.useState(search.q || "");
  const [debouncedQuery] = useDebouncedValue(query, { wait: 300 });

  const pageCount = Math.ceil(clan.total / clan.pageSize);

  const showPagination = pageCount > 1 || search.page !== undefined;
  const showSearch = pageCount > 1 || !!query;

  React.useEffect(() => {
    console.log("debouncedQuery", debouncedQuery);
    if (debouncedQuery.length > 0) {
      navigate({
        to: "/clan/$name",
        params: { name: params.name },
        search: { q: debouncedQuery },
      });
    } else {
      navigate({
        to: "/clan/$name",
        params: { name: params.name },
      });
    }
  }, [debouncedQuery]);

  return (
    <>
      <Header />
      <div className="container max-w-3xl mx-auto py-8 px-4 relative min-h-screen flex flex-col">
        <div className="flex flex-row items-end gap-x-8">
          <h1 className="text-4xl font-bold text-secondary-foreground">
            {clan.name}
          </h1>
          {showSearch && (
            <Input
              placeholder={`Search ${clan.memberCount} ${clan.memberCount !== 1 ? "members" : "member"}...`}
              className="flex-1 max-w-[300px] ml-auto"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
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
                className="pt-3 overflow-hidden flex flex-row relative group"
              >
                <div className="bg-card border rounded-md p-4 flex flex-row items-center gap-x-2 flex-1 group-hover:border-primary">
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
                {/* <div className="absolute right-4 -top-4 w-24 flex flex-row items-center">
                  <PlayerModelHead username={member.username} />
                </div> */}
              </Link>
            );
          })}
        </div>

        {showPagination && (
          <BasicPagination
            className="justify-end mt-6"
            totalItems={clan.total}
            pageSize={clan.pageSize}
            currentPage={clan.page}
            onPageChange={(page) => {
              navigate({
                to: "/clan/$name",
                params: { name: params.name },
                search: { page },
              });
            }}
          />
        )}
      </div>
      <Footer />
    </>
  );
}

const material = new MeshStandardMaterial({
  vertexColors: true,
});

const PlayerModelHead = React.memo(({ username }: { username: string }) => {
  const [playerObject, setPlayerObject] =
    React.useState<Mesh<BufferGeometry, MeshStandardMaterial>>();

  React.useEffect(() => {
    const createMesh = (geometry: BufferGeometry) => {
      geometry.computeVertexNormals();
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
