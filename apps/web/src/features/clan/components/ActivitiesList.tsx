import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";

import { BasicPagination } from "~/shared/components/BasicPagination";

import { clanActivitiesQueryOptions } from "../hooks";
import { ActivityRenderMap } from "./ActivityRenderers";

interface ActivitiesListProps {
  membersPage?: number;
}

export function ActivitiesList({ membersPage }: ActivitiesListProps) {
  const params = useParams({ from: "/clan/$name" });
  const search = useSearch({ from: "/clan/$name" });
  const navigate = useNavigate();

  const { data: activities } = useSuspenseQuery(
    clanActivitiesQueryOptions({
      name: params.name,
      page: search.activityPage,
    }),
  );

  const pageCount = Math.ceil(activities.total / activities.pageSize);

  const showPagination = pageCount > 1 || membersPage !== undefined;

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
            <div className="bg-card border rounded-md h-16 px-4 flex flex-row items-center gap-x-2 flex-1 group-hover:border-primary">
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
              to: "/clan/$name",
              params: { name: params.name },
              search: (prev) => ({ ...prev, activityPage: page }),
              resetScroll: false,
            });
          }}
        />
      )}
    </div>
  );
}
