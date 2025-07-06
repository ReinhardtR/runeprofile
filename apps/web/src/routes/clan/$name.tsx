import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ErrorComponentProps,
  Link,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import React from "react";
import { z } from "zod";

import {
  ActivityEventType,
  COLLECTION_LOG_ITEMS,
  MAX_SKILL_XP,
  getAchievementDiaryAreaName,
  getAchievementDiaryTierName,
  getCombatAchievementTierName,
  getQuestById,
} from "@runeprofile/runescape";

import AccountTypeIcons from "~/assets/account-type-icons.json";
import ClanRankIcons from "~/assets/clan-rank-icons.json";
import CombatAchievementTierIcons from "~/assets/combat-achievement-tier-icons.json";
import AchievementDiaryIcon from "~/assets/icons/achievement-diaries.png";
import QuestIcon from "~/assets/icons/quest.png";
import ITEM_ICONS from "~/assets/item-icons.json";
import MiscIcons from "~/assets/misc-icons.json";
import QuestionMarkImage from "~/assets/misc/question-mark.png";
import SkillIconsLarge from "~/assets/skill-icons-large.json";
import { BasicPagination } from "~/components/basic-pagination";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getClanActivities, getClanMembers } from "~/lib/api";
import { base64ImgSrc, cn, numberWithAbbreviation } from "~/lib/utils";

function clanQueryOptions(params: Parameters<typeof getClanMembers>[0]) {
  return {
    queryKey: ["clan", params],
    queryFn: () => getClanMembers(params),
  };
}

function clanActivitiesQueryOptions(
  params: Parameters<typeof getClanActivities>[0],
) {
  return {
    queryKey: ["clan", "activities", params],
    queryFn: () => getClanActivities(params),
  };
}

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
          <div className="lg:max-w-[300px]">
            <MembersList />
          </div>
          <Separator
            orientation="horizontal"
            className="block lg:hidden my-4"
          />
          <div className="flex-1">
            <ActivitiesList />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function ActivityContent(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center font-runescape text-lg gap-x-1">
      {props.children}
    </div>
  );
}

function ActivityIcon(props: { children: React.ReactNode }) {
  return (
    <div className="size-9 flex flex-row items-center justify-center">
      {props.children}
    </div>
  );
}

type ClanActivityEvent = Awaited<
  ReturnType<typeof getClanActivities>
>["activities"][number];

const ActivityRenderMap = {
  [ActivityEventType.NEW_ITEM_OBTAINED]: (
    event: Extract<
      ClanActivityEvent,
      { type: typeof ActivityEventType.NEW_ITEM_OBTAINED }
    >,
  ) => {
    const itemIcon =
      ITEM_ICONS[event.data.itemId as unknown as keyof typeof ITEM_ICONS];
    const iconSrc = itemIcon ? base64ImgSrc(itemIcon) : QuestionMarkImage;
    const itemName = COLLECTION_LOG_ITEMS[event.data.itemId] ?? "Unknown";
    return (
      <>
        <ActivityIcon>
          <img
            src={iconSrc}
            alt={itemName}
            className={cn(
              "z-10 drop-shadow-2xl brightness-[0.85] object-contain mx-auto",
            )}
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>obtained</span>
          <span className="text-secondary-foreground">
            {itemName ?? "Unknown Item"}
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.LEVEL_UP]: (
    event: Extract<
      ClanActivityEvent,
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
          <img
            src={base64ImgSrc(skillIcon)}
            alt={event.data.name}
            className="size-6.5 object-contain drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>reached level</span>
          <span className="text-secondary-foreground">
            {event.data.level} in {event.data.name}
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.XP_MILESTONE]: (
    event: Extract<
      ClanActivityEvent,
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
          <img
            src={base64ImgSrc(skillIcon)}
            alt={event.data.name}
            className="size-6.5 object-contain drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>reached</span>
          <span
            className={cn("text-secondary-foreground", {
              "shimmer-text": event.data.xp >= MAX_SKILL_XP,
            })}
          >
            {numberWithAbbreviation(event.data.xp)} XP in {event.data.name}
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.ACHIEVEMENT_DIARY_TIER_COMPLETED]: (
    event: Extract<
      ClanActivityEvent,
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
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>completed the</span>
          <span className="text-secondary-foreground">
            {tierName} diary in {areaName}
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED]: (
    event: Extract<
      ClanActivityEvent,
      { type: typeof ActivityEventType.COMBAT_ACHIEVEMENT_TIER_COMPLETED }
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
          <img
            src={base64ImgSrc(tierIcon)}
            alt={tierName}
            className="size-7 object-contain drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>completed all</span>
          <span className="text-secondary-foreground">
            {tierName} Combat Achievements
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.QUEST_COMPLETED]: (
    event: Extract<
      ClanActivityEvent,
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
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>completed</span>
          <span className="text-secondary-foreground">
            {quest?.name ?? "Unknown"}
          </span>
        </ActivityContent>
      </>
    );
  },
  [ActivityEventType.MAXED]: (
    event: Extract<ClanActivityEvent, { type: typeof ActivityEventType.MAXED }>,
  ) => {
    return (
      <>
        <ActivityIcon>
          <img
            src={MiscIcons["max_cape"]}
            alt="Maxed"
            className="size-7 object-contain drop-shadow-solid-sm"
          />
        </ActivityIcon>
        <ActivityContent>
          <ActivityAccount account={event.account} />
          <span>has</span>
          <span className="shimmer-text">Maxed</span>
          <span>all skills.</span>
        </ActivityContent>
      </>
    );
  },
};

function ActivityAccount({
  account,
}: {
  account: ClanActivityEvent["account"];
}) {
  const accountTypeIcon =
    AccountTypeIcons[account.accountType.key as keyof typeof AccountTypeIcons];

  return (
    <div className="flex flex-row items-center gap-x-1.5">
      <img
        src={base64ImgSrc(
          ClanRankIcons[String(account.clanIcon) as keyof typeof ClanRankIcons],
        )}
        width={16}
        height={16}
        className="drop-shadow-solid-sm"
      />
      {!!accountTypeIcon && (
        <img
          src={base64ImgSrc(accountTypeIcon)}
          alt={account.accountType.name}
          width={16}
          height={16}
          className="drop-shadow-solid text-xs"
        />
      )}
      <span className="font-bold text-lg font-runescape solid-text-shadow">
        {account.username}
      </span>
    </div>
  );
}

function ActivitiesList() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: activities } = useSuspenseQuery(
    clanActivitiesQueryOptions({
      name: params.name,
      page: search.activityPage,
    }),
  );

  const pageCount = Math.ceil(activities.total / activities.pageSize);

  const showPagination = pageCount > 1 || search.membersPage !== undefined;

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
              search: (prev) => ({ ...prev, activityPage: page }),
              resetScroll: false,
            });
          }}
        />
      )}
    </div>
  );
}

function MembersList() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: clan } = useSuspenseQuery(
    clanQueryOptions({
      name: params.name,
      page: search.membersPage,
    }),
  );

  const pageCount = Math.ceil(clan.total / clan.pageSize);

  const showPagination = pageCount > 1 || search.membersPage !== undefined;

  return (
    <div className="relative flex flex-col">
      <p className="text-primary font-semibold">Members</p>
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
              <div className="bg-card border rounded-md px-4 h-16 flex flex-row items-center gap-x-2 flex-1 group-hover:border-primary">
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
              search: (prev) => ({ ...prev, membersPage: page }),
              resetScroll: false,
            });
          }}
        />
      )}
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
