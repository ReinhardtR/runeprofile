import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";

import { ActivityRenderMap } from "~/features/clan/components/activity-renderers";
import { groupActivitiesQueryOptions } from "~/features/group/queries";
import { BasicPagination } from "~/shared/components/BasicPagination";

export function GroupActivitiesList() {
  const params = useParams({ from: "/group/$name" });
  const search = useSearch({ from: "/group/$name" });
  const navigate = useNavigate();

  const { data: activities } = useSuspenseQuery(
    groupActivitiesQueryOptions({
      name: params.name,
      page: search.activityPage,
    }),
  );

  const pageCount = Math.ceil(activities.total / activities.pageSize);

  const showPagination = pageCount > 1;

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
        <BasicPagination
          className="justify-end mt-6"
          totalItems={activities.total}
          pageSize={activities.pageSize}
          currentPage={activities.page}
          onPageChange={(page) => {
            navigate({
              to: "/group/$name",
              params: { name: params.name },
              search: (prev: any) => ({ ...prev, activityPage: page }),
              resetScroll: false,
            });
          }}
        />
      )}
    </div>
  );
}
