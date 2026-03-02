import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ErrorComponentProps,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { Suspense } from "react";
import { z } from "zod";

import {
  ActivitiesList,
  ActivitiesListSkeleton,
  MembersList,
  MembersListSkeleton,
  clanActivitiesQueryOptions,
  clanQueryOptions,
} from "~/features/clan";
import { Footer, Header } from "~/layouts";
import { Button } from "~/shared/components/ui/button";
import { Separator } from "~/shared/components/ui/separator";
import { Skeleton } from "~/shared/components/ui/skeleton";

const clanSearchSchema = z.object({
  activityCursor: z.string().optional().catch(undefined),
  activityDir: z.enum(["next", "prev"]).optional().catch(undefined),
  activityPage: z.coerce.number().int().min(1).optional().catch(undefined),
  membersCursor: z.string().optional().catch(undefined),
  membersDir: z.enum(["next", "prev"]).optional().catch(undefined),
  membersPage: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/clan/$name")({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  validateSearch: zodValidator(clanSearchSchema),
  loaderDeps: ({ search }) => ({
    activityCursor: search.activityCursor,
    activityDir: search.activityDir,
    membersCursor: search.membersCursor,
    membersDir: search.membersDir,
  }),
  loader: ({ params, context, deps }) => {
    // Prefetch both queries without blocking the route
    context.queryClient.prefetchQuery(
      clanQueryOptions({
        name: params.name,
        cursor: deps.membersCursor,
        direction: deps.membersDir,
      }),
    );
    context.queryClient.prefetchQuery(
      clanActivitiesQueryOptions({
        name: params.name,
        cursor: deps.activityCursor,
        direction: deps.activityDir,
      }),
    );
  },
  head: ({ params }) => ({
    meta: [
      {
        title: `${decodeURIComponent(params.name)} | RuneProfile`,
      },
    ],
  }),
});

function RouteComponent() {
  const params = Route.useParams();

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto py-8 px-4 relative min-h-screen flex flex-col">
        <Suspense fallback={<ClanHeaderSkeleton name={params.name} />}>
          <ClanHeader />
        </Suspense>
        <Separator className="my-4" />
        <div className="flex flex-col lg:flex-row gap-y-4 gap-x-8 mb-4">
          <div className="lg:max-w-[280px] w-full">
            <Suspense fallback={<MembersListSkeleton />}>
              <MembersList />
            </Suspense>
          </div>
          <Separator
            orientation="horizontal"
            className="block lg:hidden my-4"
          />
          <div className="flex-1">
            <Suspense fallback={<ActivitiesListSkeleton />}>
              <ActivitiesList />
            </Suspense>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function ClanHeader() {
  const params = Route.useParams();
  const search = Route.useSearch();

  const { data: clan } = useSuspenseQuery(
    clanQueryOptions({
      name: params.name,
      cursor: search.membersCursor,
      direction: search.membersDir,
    }),
  );

  return (
    <div className="flex flex-row items-end gap-x-8">
      <h1 className="text-4xl font-bold text-secondary-foreground">
        {clan.name}
      </h1>
      <div className="flex flex-row items-center gap-x-2 ml-auto text-sm text-muted-foreground">
        <p>{clan.total} members</p>
      </div>
    </div>
  );
}

function ClanHeaderSkeleton({ name }: { name: string }) {
  return (
    <div className="flex flex-row items-end gap-x-8">
      <h1 className="text-4xl font-bold text-secondary-foreground">
        {decodeURIComponent(name)}
      </h1>
      <div className="flex flex-row items-center gap-x-2 ml-auto text-sm text-muted-foreground">
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

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
