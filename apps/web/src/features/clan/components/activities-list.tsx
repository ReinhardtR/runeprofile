import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { Filter, LoaderCircle } from "lucide-react";

import {
  ActivityEventType,
  type ActivityEventTypeValue,
} from "@runeprofile/runescape";

import { clanActivitiesQueryOptions } from "~/features/clan/queries";
import { Button } from "~/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/shared/components/ui/dropdown-menu";

import { ActivitiesListSkeleton } from "./activities-list-skeleton";
import { ActivityRenderMap } from "./activity-renderers";

const ACTIVITY_TYPE_LABELS: Record<ActivityEventTypeValue, string> = {
  [ActivityEventType.LEVEL_UP]: "Level Up",
  [ActivityEventType.NEW_ITEM_OBTAINED]: "New Item Obtained",
  [ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED]: "Achievement Diary",
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED]: "Combat Achievement",
  [ActivityEventType.QUEST_COMPLETED]: "Quest Completed",
  [ActivityEventType.MAXED]: "Maxed",
  [ActivityEventType.XP_MILESTONE]: "XP Milestone",
  [ActivityEventType.VALUABLE_DROP]: "Valuable Drop",
};

const ALL_ACTIVITY_TYPES: ActivityEventTypeValue[] =
  Object.values(ActivityEventType);

export function ActivitiesList() {
  const params = useParams({ from: "/clan/$name" });
  const search = useSearch({ from: "/clan/$name" });
  const navigate = useNavigate();

  const page = search.activityPage ?? (search.activityCursor ? 2 : 1);
  const selectedTypes = (
    search.activityTypes ? search.activityTypes.split(",") : []
  ) as ActivityEventTypeValue[];

  const { data: activities, isFetching } = useQuery({
    ...clanActivitiesQueryOptions({
      name: params.name,
      cursor: search.activityCursor,
      direction: search.activityDir,
      activityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
    }),
    placeholderData: keepPreviousData,
  });

  function toggleActivityType(type: ActivityEventTypeValue) {
    const current = new Set(selectedTypes);
    if (current.has(type)) {
      current.delete(type);
    } else {
      current.add(type);
    }
    const types = Array.from(current);
    navigate({
      to: "/clan/$name",
      params: { name: params.name },
      search: (prev) => ({
        ...prev,
        activityTypes: types.length > 0 ? types.join(",") : undefined,
        // Reset pagination when filter changes
        activityCursor: undefined,
        activityDir: undefined,
        activityPage: undefined,
      }),
      resetScroll: false,
    });
  }

  function clearFilters() {
    navigate({
      to: "/clan/$name",
      params: { name: params.name },
      search: (prev) => ({
        ...prev,
        activityTypes: undefined,
        activityCursor: undefined,
        activityDir: undefined,
        activityPage: undefined,
      }),
      resetScroll: false,
    });
  }

  if (!activities) {
    return <ActivitiesListSkeleton />;
  }

  const showPagination = activities.hasMore || activities.hasPrev;

  return (
    <div className="relative flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <p className="text-primary font-semibold">Activities</p>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Filter className="size-3.5" />
            {selectedTypes.length > 0
              ? `${selectedTypes.length} filter${selectedTypes.length > 1 ? "s" : ""}`
              : "Filter"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Activity Types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_ACTIVITY_TYPES.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleActivityType(type)}
                  closeOnClick={false}
                >
                  {ACTIVITY_TYPE_LABELS[type] ?? type}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
            {selectedTypes.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={false}
                  onCheckedChange={() => clearFilters()}
                  closeOnClick={false}
                >
                  Clear all
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
