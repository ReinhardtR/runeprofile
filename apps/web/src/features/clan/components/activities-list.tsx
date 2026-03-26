import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";

import { clanActivitiesQueryOptions } from "~/features/clan/queries";
import { Button } from "~/shared/components/ui/button";

import { ActivitiesListSkeleton } from "./activities-list-skeleton";
import { ActivityRenderMap } from "./activity-renderers";

export function ActivitiesList() {
  const params = useParams({ from: "/clan/$name" });
  const search = useSearch({ from: "/clan/$name" });
  const navigate = useNavigate();

  const page = search.activityPage ?? (search.activityCursor ? 2 : 1);

  const { data: activities, isFetching } = useQuery({
    ...clanActivitiesQueryOptions({
      name: params.name,
      cursor: search.activityCursor,
      direction: search.activityDir,
    }),
    placeholderData: keepPreviousData,
  });

  if (!activities) {
    return <ActivitiesListSkeleton />;
  }

  const showPagination = activities.hasMore || activities.hasPrev;

  return (
    <div className="relative flex flex-col">
      <p className="text-primary font-semibold">Activities</p>
      {activities.activities.map((event) => {
        const render =
          ActivityRenderMap[event.type as keyof typeof ActivityRenderMap];

        if (!render) return null;

        return (
          <Link
            key={event.id}
            to="/$username"
            params={{ username: event.account.username }}
            className="pt-3 overflow-hidden flex flex-row relative group"
          >
            <div className="bg-card border rounded-md min-h-16 lg:h-16 px-4 py-2 lg:py-0 flex flex-row items-center gap-x-2 flex-1 group-hover:border-primary">
              {render(event as any)}
            </div>
          </Link>
        );
      })}

      {showPagination && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-x-2">
            <p className="text-xs text-muted-foreground">Page {page}</p>
            {isFetching && (
              <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex justify-end gap-x-2">
            <Button
              variant="outline"
              disabled={!activities.hasPrev}
              onClick={() => {
                const nextPage = Math.max(1, page - 1);
                const isFirstPage = nextPage === 1;

                navigate({
                  to: "/clan/$name",
                  params: { name: params.name },
                  search: (prev) => ({
                    ...prev,
                    activityPage: nextPage,
                    activityCursor: isFirstPage
                      ? undefined
                      : (activities.prevCursor ?? undefined),
                    activityDir: isFirstPage ? undefined : ("prev" as const),
                  }),
                  resetScroll: false,
                });
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!activities.hasMore}
              onClick={() => {
                navigate({
                  to: "/clan/$name",
                  params: { name: params.name },
                  search: (prev) => ({
                    ...prev,
                    activityPage: page + 1,
                    activityCursor: activities.nextCursor ?? undefined,
                    activityDir: undefined,
                  }),
                  resetScroll: false,
                });
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
