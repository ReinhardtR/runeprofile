import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ErrorComponentProps,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import {
  ActivitiesList,
  MembersList,
  clanActivitiesQueryOptions,
  clanQueryOptions,
} from "~/features/clan";
import { Footer, Header } from "~/layouts";
import { Button } from "~/shared/components/ui/button";
import { Separator } from "~/shared/components/ui/separator";

const clanSearchSchema = z.object({
  activityPage: z.coerce.number().gt(0).optional().catch(undefined),
  membersPage: z.coerce.number().gt(0).optional().catch(undefined),
});

export const Route = createFileRoute("/clan/$name")({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  validateSearch: zodValidator(clanSearchSchema),
  loaderDeps: ({ search: { activityPage, membersPage } }) => ({
    activityPage,
    membersPage,
  }),
  loader: ({ params, context, deps }) => {
    return Promise.all([
      context.queryClient.fetchQuery(
        clanQueryOptions({
          name: params.name,
          page: deps.membersPage,
        }),
      ),
      context.queryClient.fetchQuery(
        clanActivitiesQueryOptions({
          name: params.name,
          page: deps.activityPage,
        }),
      ),
    ]);
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData[0].name} | RuneProfile`,
      },
    ],
  }),
});

function RouteComponent() {
  const params = Route.useParams();
  const search = Route.useSearch();

  const { data: clan } = useSuspenseQuery(
    clanQueryOptions({
      name: params.name,
      page: search.membersPage,
    }),
  );

  const { data: activities } = useSuspenseQuery(
    clanActivitiesQueryOptions({
      name: params.name,
      page: search.activityPage,
    }),
  );

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto py-8 px-4 relative min-h-screen flex flex-col">
        <div className="flex flex-row items-end gap-x-8">
          <h1 className="text-4xl font-bold text-secondary-foreground">
            {clan.name}
          </h1>
          <div className="flex flex-row items-center gap-x-2 ml-auto text-sm text-muted-foreground">
            <p>{clan.total} members</p>
            <p>•</p>
            <p>{activities.total} activities</p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col lg:flex-row gap-y-4 gap-x-8 mb-4">
          <div className="lg:max-w-[280px] w-full">
            <MembersList />
          </div>
          <Separator
            orientation="horizontal"
            className="block lg:hidden my-4"
          />
          <div className="flex-1">
            <ActivitiesList membersPage={search.membersPage} />
          </div>
        </div>
      </div>
      <Footer />
    </>
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
