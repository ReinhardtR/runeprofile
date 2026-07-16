import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import { Filter, LoaderCircle } from "lucide-react";
import React from "react";

import {
  type ActivityEvent,
  ActivityEventType,
  type ActivityEventTypeValue,
  COLLECTION_LOG_ITEMS,
  MAX_SKILL_XP,
  getAchievementDiaryAreaName,
  getAchievementDiaryTierName,
  getCombatAchievementTierName,
  getQuestById,
} from "@runeprofile/runescape";

import { getProfileActivities } from "~/core/api";
import CombatAchievementTierIcons from "~/core/assets/combat-achievement-tier-icons.json";
import AchievementDiaryIcon from "~/core/assets/icons/achievement-diaries.png";
import QuestIcon from "~/core/assets/icons/quest.png";
import ITEM_ICONS from "~/core/assets/item-icons.json";
import MiscIcons from "~/core/assets/misc-icons.json";
import QuestionMarkImage from "~/core/assets/misc/question-mark.png";
import SkillIconsLarge from "~/core/assets/skill-icons-large.json";
import { ActivityIcon } from "~/features/clan/components/activity-renderers";
import { GameIcon } from "~/shared/components/icons";
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
import { Skeleton } from "~/shared/components/ui/skeleton";
import {
  cn,
  formatRelativeTime,
  itemIconUrl,
  numberWithAbbreviation,
  numberWithDelimiter,
} from "~/shared/utils";

// The activities endpoint serializes each row with `createdAt` and `id`
// alongside the discriminated `ActivityEvent` union, so basing the row type on
// `ActivityEvent` (rather than the endpoint's widened return type) lets the
// per-type renderers narrow `data` correctly.
type ProfileActivityEvent = ActivityEvent & { id: string; createdAt: string };

export function profileActivitiesInfiniteQueryOptions(params: {
  username: string;
  activityTypes?: ActivityEventTypeValue[];
}) {
  return infiniteQueryOptions({
    queryKey: ["profile", "activities", params.username, params.activityTypes],
    queryFn: ({ pageParam }) =>
      getProfileActivities({
        username: params.username,
        cursor: pageParam,
        limit: 20,
        activityTypes: params.activityTypes,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
}

const ACTIVITY_TYPE_LABELS: Partial<Record<ActivityEventTypeValue, string>> = {
  [ActivityEventType.LEVEL_UP]: "Level Up",
  [ActivityEventType.NEW_ITEM_OBTAINED]: "New Item Obtained",
  [ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED]: "Achievement Diary",
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_REACHED]: "Combat Achievement",
  [ActivityEventType.QUEST_COMPLETED]: "Quest Completed",
  [ActivityEventType.MAXED]: "Maxed",
  [ActivityEventType.XP_MILESTONE]: "XP Milestone",
  [ActivityEventType.VALUABLE_DROP]: "Valuable Drop",
};

export function ProfileActivities({
  username,
  enabled = true,
  className,
}: {
  username: string;
  enabled?: boolean;
  className?: string;
}) {
  const [selectedTypes, setSelectedTypes] = React.useState<
    ActivityEventTypeValue[]
  >([]);

  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    ...profileActivitiesInfiniteQueryOptions({
      username,
      activityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
    }),
    enabled,
  });

  function toggleActivityType(type: ActivityEventTypeValue) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  const activities = (data?.pages.flatMap((page) => page.activities) ??
    []) as ProfileActivityEvent[];

  return (
    <div className={cn("relative flex flex-col", className)}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-primary font-semibold">Activities</p>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Filter className="size-3.5" />
            {selectedTypes.length > 0
              ? `${selectedTypes.length} filter${selectedTypes.length > 1 ? "s" : ""}`
              : "Filter"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-[60]">
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
                  onCheckedChange={() => setSelectedTypes([])}
                  closeOnClick={false}
                >
                  Clear all
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isPending ? (
        <ProfileActivitiesSkeleton />
      ) : activities.length === 0 ? (
        <div className="flex flex-row items-center justify-center py-12">
          <p className="text-xl font-runescape text-osrs-gray">
            None tracked yet
          </p>
        </div>
      ) : (
        <>
          {activities.map((event) => {
            const render =
              ProfileActivityRenderMap[
                event.type as keyof typeof ProfileActivityRenderMap
              ];

            if (!render) return null;

            return (
              <div
                key={event.id}
                className="pt-3 overflow-hidden flex flex-row"
              >
                <div className="bg-card border rounded-md min-h-16 px-4 py-2.5 flex flex-row items-center gap-x-2 flex-1">
                  {render(event as any)}
                </div>
              </div>
            );
          })}

          {hasNextPage && (
            <Button
              variant="outline"
              className="mt-4"
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {isFetchingNextPage ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                "Load more"
              )}
            </Button>
          )}

          {isFetching && !isFetchingNextPage && (
            <div className="flex justify-center mt-2">
              <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProfileActivitiesSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="pt-3 overflow-hidden flex flex-row">
          <div className="bg-card border rounded-md min-h-16 px-4 py-2.5 flex flex-row items-center gap-x-2 flex-1">
            <Skeleton className="size-9 rounded-sm shrink-0" />
            <div className="flex flex-col flex-1 gap-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// Activity text with the timestamp stacked underneath (rather than pushed to the
// right like the clan feed) so long descriptions don't get squeezed in the
// narrow side panel.
function ProfileActivityContent({
  children,
  createdAt,
}: {
  children: React.ReactNode;
  createdAt: string;
}) {
  return (
    <div className="flex flex-col flex-1 min-w-0 gap-y-0.5">
      <div className="flex flex-wrap items-center font-runescape text-lg gap-x-1 leading-tight">
        {children}
      </div>
      <span className="text-xs text-muted-foreground">
        {formatRelativeTime(createdAt)}
      </span>
    </div>
  );
}

const ProfileActivityRenderMap = {
  [ActivityEventType.NEW_ITEM_OBTAINED]: (
    event: Extract<
      ProfileActivityEvent,
      { type: typeof ActivityEventType.NEW_ITEM_OBTAINED }
    >,
  ) => {
    const itemIcon =
      ITEM_ICONS[event.data.itemId as unknown as keyof typeof ITEM_ICONS];
    const itemName = COLLECTION_LOG_ITEMS[event.data.itemId] ?? "Unknown";
    return (
      <>
        <ActivityIcon>
          {itemIcon ? (
            <GameIcon
              src={itemIcon}
              alt={itemName}
              size={26}
              className="z-10 drop-shadow-2xl mx-auto"
            />
          ) : (
            <img
              src={QuestionMarkImage}
              alt={itemName}
              className="z-10 drop-shadow-2xl object-contain mx-auto size-[26px]"
            />
          )}
        </ActivityIcon>
        <ProfileActivityContent createdAt={event.createdAt}>
          <span>Obtained</span>
          <span className="text-secondary-foreground">{itemName}</span>
        </ProfileActivityContent>
      </>
    );
  },
  [ActivityEventType.LEVEL_UP]: (
    event: Extract<
      ProfileActivityEvent,
      { type: typeof ActivityEventType.LEVEL_UP }
    >,
  ) => {
    const skillIcon =
      SkillIconsLarge[
        event.data.name.toLowerCase() as unknown as keyof typeof SkillIconsLarge
      ];
    return (
      <>
        <ActivityIcon>
          <GameIcon
            src={skillIcon}
            alt={event.data.name}
            size={26}
            className="drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ProfileActivityContent createdAt={event.createdAt}>
          <span>Reached level</span>
          <span className="text-secondary-foreground">
            {event.data.level} in {event.data.name}
          </span>
        </ProfileActivityContent>
      </>
    );
  },
  [ActivityEventType.XP_MILESTONE]: (
    event: Extract<
      ProfileActivityEvent,
      { type: typeof ActivityEventType.XP_MILESTONE }
    >,
  ) => {
    const skillIcon =
      SkillIconsLarge[
        event.data.name.toLowerCase() as unknown as keyof typeof SkillIconsLarge
      ];
    return (
      <>
        <ActivityIcon>
          <GameIcon
            src={skillIcon}
            alt={event.data.name}
            size={26}
            className="drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ProfileActivityContent createdAt={event.createdAt}>
          <span>Reached</span>
          <span
            className={cn("text-secondary-foreground", {
              "shimmer-text": event.data.xp >= MAX_SKILL_XP,
            })}
          >
            {numberWithAbbreviation(event.data.xp)} XP in {event.data.name}
          </span>
        </ProfileActivityContent>
      </>
    );
  },
  [ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED]: (
    event: Extract<
      ProfileActivityEvent,
      { type: typeof ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED }
    >,
  ) => {
    const areaName =
      getAchievementDiaryAreaName(event.data.areaId) ?? "Unknown";
    const tierName = getAchievementDiaryTierName(event.data.tier) ?? "Unknown";
    return (
      <>
        <ActivityIcon>
          <img
            src={AchievementDiaryIcon}
            className="size-7 object-contain drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ProfileActivityContent createdAt={event.createdAt}>
          <span>Completed the</span>
          <span className="text-secondary-foreground">
            {tierName} diary in {areaName}
          </span>
        </ProfileActivityContent>
      </>
    );
  },
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_REACHED]: (
    event: Extract<
      ProfileActivityEvent,
      { type: typeof ActivityEventType.COMBAT_ACHIEVEMENT_TIER_REACHED }
    >,
  ) => {
    const tierIcon =
      CombatAchievementTierIcons[
        event.data.tierId as unknown as keyof typeof CombatAchievementTierIcons
      ];
    const tierName =
      getCombatAchievementTierName(event.data.tierId) ?? "Unknown";
    return (
      <>
        <ActivityIcon>
          <GameIcon
            src={tierIcon}
            alt={tierName}
            size={28}
            className="drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ProfileActivityContent createdAt={event.createdAt}>
          <span>Reached the</span>
          <span
            className={cn(
              "text-secondary-foreground",
              event.data.tierId === 6 && "shimmer-text",
            )}
          >
            {tierName} Combat Achievement Tier
          </span>
        </ProfileActivityContent>
      </>
    );
  },
  [ActivityEventType.QUEST_COMPLETED]: (
    event: Extract<
      ProfileActivityEvent,
      { type: typeof ActivityEventType.QUEST_COMPLETED }
    >,
  ) => {
    const quest = getQuestById(event.data.questId);
    return (
      <>
        <ActivityIcon>
          <img
            src={QuestIcon}
            alt="Quest"
            className="size-6.5 object-contain drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ProfileActivityContent createdAt={event.createdAt}>
          <span>Completed</span>
          <span className="text-secondary-foreground">
            {quest?.name ?? "Unknown"}
          </span>
        </ProfileActivityContent>
      </>
    );
  },
  [ActivityEventType.MAXED]: (
    event: Extract<
      ProfileActivityEvent,
      { type: typeof ActivityEventType.MAXED }
    >,
  ) => {
    return (
      <>
        <ActivityIcon>
          <GameIcon
            src={MiscIcons["max_cape"]}
            alt="Maxed"
            size={28}
            className="drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ProfileActivityContent createdAt={event.createdAt}>
          <span className="shimmer-text">Maxed</span>
          <span>all skills.</span>
        </ProfileActivityContent>
      </>
    );
  },
  [ActivityEventType.VALUABLE_DROP]: (
    event: Extract<
      ProfileActivityEvent,
      { type: typeof ActivityEventType.VALUABLE_DROP }
    >,
  ) => {
    return (
      <>
        <ActivityIcon>
          <img
            src={itemIconUrl(event.data.itemId)}
            className={cn("z-10 drop-shadow-2xl object-contain mx-auto")}
          />
        </ActivityIcon>
        <ProfileActivityContent createdAt={event.createdAt}>
          <span>Received a valuable drop worth</span>
          <span className="text-secondary-foreground">
            {numberWithDelimiter(event.data.value)} gp
          </span>
        </ProfileActivityContent>
      </>
    );
  },
};

// Only surface activity types that the feed can actually render. This excludes
// the legacy `COMBAT_ACHIEVEMENT_TIER_COMPLETED` event, which is superseded by
// `COMBAT_ACHIEVEMENT_TIER_REACHED`.
const ALL_ACTIVITY_TYPES = Object.keys(
  ProfileActivityRenderMap,
) as ActivityEventTypeValue[];
