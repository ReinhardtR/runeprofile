import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  ErrorComponentProps,
  Link,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useAtom } from "jotai";
import { Activity, Bot, LoaderCircle, SearchIcon, X } from "lucide-react";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { z } from "zod";

import {
  COLLECTION_LOG_ITEM_IDS,
  COLLECTION_LOG_TABS,
  COMBAT_ACHIEVEMENT_TASKS,
  COMBAT_ACHIEVEMENT_TASK_TYPES,
} from "@runeprofile/runescape";

import { Profile, RuneProfileApiError, getProfile } from "~/core/api";
import CombatAchievementsIcon from "~/core/assets/icons/combat-achievements.png";
import HiscoresIcon from "~/core/assets/icons/hiscores.png";
import Logo from "~/core/assets/misc/logo.png";
import { DISCORD_INVITE_INK } from "~/core/constants";
import {
  Character,
  CollectionLog,
  CombatAchievementsPanel,
  DataTabsCard,
  Hiscores,
  ProfileActivities,
  RecentActivities,
  RecentCollections,
  hiscoresQueryOptions,
} from "~/features/profile/components";
import { isSearchDialogOpenAtom } from "~/features/search";
import { Footer } from "~/layouts";
import { DiscordIcon, KofiIcon } from "~/shared/components/icons";
import { Button, ButtonProps } from "~/shared/components/ui/button";
import { ScrollArea } from "~/shared/components/ui/scroll-area";
import { Sheet, SheetContent } from "~/shared/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/shared/components/ui/tooltip";
import { cn, getCollectionLogRankIcon } from "~/shared/utils";

function profileQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["profile", { username }],
    queryFn: () => getProfile({ username }),
  });
}

const COLLECTION_LOG_PAGES: string[] = COLLECTION_LOG_TABS.map((tab) =>
  tab.pages.map((p) => p.name.toLowerCase()),
).flat();

const VALID_TABS = ["skills", "quests", "diaries", "cas"] as const;
const VALID_PANELS = ["cas", "clog"] as const;

const VALID_CA_VIEWS = ["tasks", "bosses"] as const;
const VALID_CA_COMPLETION = ["all", "completed", "incomplete"] as const;
const VALID_CA_TYPES = ["all", ...COMBAT_ACHIEVEMENT_TASK_TYPES] as const;
const VALID_CA_MONSTERS = new Set(
  COMBAT_ACHIEVEMENT_TASKS.map((t) => t.monster),
);

const profileSearchSchema = z.object({
  page: z
    .string()
    .transform((value) => value.toLowerCase())
    .refine((value) => COLLECTION_LOG_PAGES.includes(value))
    .optional()
    .catch(undefined),
  tab: z.enum(VALID_TABS).optional().catch(undefined),
  "ca-tier": z.coerce.number().int().min(0).max(6).optional().catch(undefined),
  "ca-view": z.enum(VALID_CA_VIEWS).optional().catch(undefined),
  "ca-monster": z
    .string()
    .refine((value) => VALID_CA_MONSTERS.has(value))
    .optional()
    .catch(undefined),
  "ca-type": z.enum(VALID_CA_TYPES).optional().catch(undefined),
  "ca-completed": z.enum(VALID_CA_COMPLETION).optional().catch(undefined),
  "ca-hide-completed": z.coerce.boolean().optional().catch(undefined),
  "ca-panel": z.enum(VALID_PANELS).optional().catch(undefined),
});

export type ProfileSearch = z.infer<typeof profileSearchSchema>;

export const Route = createFileRoute("/$username")({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  validateSearch: zodValidator(profileSearchSchema),
  loader: async ({ params, context }) => {
    context.queryClient.prefetchQuery(
      hiscoresQueryOptions({
        username: params.username,
        leaderboard: "normal",
      }),
    );

    return context.queryClient.fetchQuery(profileQueryOptions(params.username));
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData.username} | RuneProfile`,
      },
    ],
  }),
});

function RouteComponent() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: profile } = useSuspenseQuery(
    profileQueryOptions(params.username),
  );

  const page =
    search.page || profile.defaultClogPage || COLLECTION_LOG_PAGES[0];

  const updateSearch = React.useCallback(
    (updates: Partial<z.infer<typeof profileSearchSchema>>) => {
      navigate({
        search: (prev) => ({ ...prev, ...updates }),
        resetScroll: false,
      });
    },
    [navigate],
  );

  return (
    <>
      <div className="flex flex-row items-stretch min-h-screen overflow-x-hidden relative">
        <ProfileContent
          profile={profile}
          page={page}
          search={search}
          updateSearch={updateSearch}
        />

        <SidePanel username={profile.username} />
      </div>
      <Footer />
    </>
  );
}

export function ProfileContent({
  profile,
  page,
  search,
  updateSearch,
}: {
  profile: Profile;
  page: string;
  search: ProfileSearch;
  updateSearch: (updates: Partial<ProfileSearch>) => void;
}) {
  const activeTab = search.tab ?? "skills";
  const selectedCaTierId = search["ca-tier"] ?? 0;
  const showCaPanel =
    search["ca-panel"] === "cas" ||
    (search["ca-panel"] == null && activeTab === "cas");

  const clogRankIcon = React.useMemo(() => {
    const obtainedCount = COLLECTION_LOG_ITEM_IDS.filter((id) =>
      profile.items.some((item) => item.id === id && item.quantity > 0),
    ).length;
    return getCollectionLogRankIcon(obtainedCount);
  }, [profile.items]);

  return (
    <div className="flex flex-col justify-center items-center w-full gap-8 xl:gap-4 xl:flex-row max-h-full py-16">
      <div className="flex flex-row flex-wrap justify-center xl:flex-nowrap xl:flex-col gap-4">
        <Character
          username={profile.username}
          accountType={profile.accountType}
          clan={profile.clan}
          groupName={profile.groupName}
          createdAt={new Date(profile.createdAt)}
          updatedAt={new Date(profile.updatedAt)}
        />
        <DataTabsCard
          activeTab={activeTab}
          onTabChange={(tab) =>
            updateSearch({
              tab: tab as typeof search.tab,
              "ca-panel": undefined,
            })
          }
          skills={profile.skills}
          quests={profile.quests}
          achievementDiaries={profile.achievementDiaryTiers}
          combatAchievements={profile.combatAchievementTiers}
          accountTypeId={profile.accountType.id}
          selectedCaTierId={selectedCaTierId}
          onCaTierChange={(caTier) => updateSearch({ "ca-tier": caTier })}
        />
      </div>

      <div className="flex flex-row items-center justify-center flex-wrap xl:flex-nowrap xl:flex-col gap-6 lg:w-[680px]">
        <div className="relative lg:w-full">
          {showCaPanel ? (
            <CombatAchievementsPanel
              combatAchievementTiers={profile.combatAchievementTiers}
              combatAchievementVarps={profile.combatAchievementVarps}
              totalPoints={profile.totalCombatAchievementPoints}
              selectedTierId={selectedCaTierId}
              onTierChange={(caTier) => updateSearch({ "ca-tier": caTier })}
              viewMode={search["ca-view"] ?? "tasks"}
              onViewModeChange={(caView) => updateSearch({ "ca-view": caView })}
              monsterFilter={search["ca-monster"] ?? "all"}
              onMonsterFilterChange={(caMonster) =>
                updateSearch({
                  "ca-monster": caMonster === "all" ? undefined : caMonster,
                })
              }
              typeFilter={search["ca-type"] ?? "all"}
              onTypeFilterChange={(caType) =>
                updateSearch({
                  "ca-type":
                    caType === "all"
                      ? undefined
                      : (caType as (typeof search)["ca-type"]),
                })
              }
              completionFilter={search["ca-completed"] ?? "all"}
              onCompletionFilterChange={(caCompleted) =>
                updateSearch({
                  "ca-completed":
                    caCompleted === "all" ? undefined : caCompleted,
                })
              }
              hideCompletedBosses={search["ca-hide-completed"] ?? false}
              onHideCompletedBossesChange={(hide) =>
                updateSearch({
                  "ca-hide-completed": hide ? true : undefined,
                })
              }
            />
          ) : (
            <CollectionLog
              username={profile.username}
              page={page}
              onPageChange={(newPage) => updateSearch({ page: newPage })}
              onNavigateToCaBoss={(bossName) =>
                updateSearch({
                  "ca-panel": "cas",
                  "ca-view": "tasks",
                  "ca-monster": bossName,
                  "ca-tier": 0,
                })
              }
              data={profile.items}
            />
          )}
          <button
            type="button"
            className="absolute -top-[14px] left-4 lg:left-auto lg:right-4 z-30 flex h-7 items-center gap-1 px-1.5 brightness-75 hover:brightness-100 drop-shadow-solid cursor-pointer"
            onClick={() =>
              updateSearch({
                "ca-panel": showCaPanel ? "clog" : "cas",
              })
            }
          >
            <span className="hidden lg:inline font-runescape text-sm text-osrs-orange solid-text-shadow">
              {showCaPanel ? "View Clog" : "View CAs"}
            </span>
            <img
              src={showCaPanel ? clogRankIcon : CombatAchievementsIcon}
              alt=""
              className="h-6 w-6 shrink-0 object-contain"
            />
          </button>
        </div>
        <RecentCollections events={profile.recentItems} />
        <RecentActivities events={profile.recentActivities} />
      </div>
    </div>
  );
}

function ErrorComponent(props: ErrorComponentProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-y-4 items-center justify-center min-h-screen">
      <p className="text-2xl text-primary-foreground">{props.error.message}</p>
      {props.error instanceof RuneProfileApiError &&
        props.error.code === "AccountNotFound" && (
          <p className="text-muted-foreground text-center">
            Make sure you have updated your profile using the plugin.
            <br />
            If needed you can follow the guide{" "}
            <Link
              to="/info/guide"
              className="text-secondary-foreground underline"
            >
              here
            </Link>
            .
          </p>
        )}
      <Button onClick={() => navigate({ to: "/" })}>Home Teleport</Button>
      <Button variant="ghost" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  );
}

export function SidePanel({ username }: { username: string }) {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useAtom(
    isSearchDialogOpenAtom,
  );
  const [isHiscoresOpen, setIsHiscoresOpen] = React.useState(false);
  const [isActivitiesOpen, setIsActivitiesOpen] = React.useState(false);

  const hiscoresQuery = useQuery(
    hiscoresQueryOptions({
      username,
      leaderboard: "normal",
    }),
  );

  return (
    <>
      <div className="w-16 bg-card flex flex-col items-center py-2 px-1 z-50 gap-y-2">
        <Link to="/" className="size-14">
          <SidePanelButton className="p-0" tooltip="Home page">
            <img src={Logo} className="w-full h-full" />
          </SidePanelButton>
        </Link>

        <SidePanelButton
          tooltip="Search for a player"
          isActive={isSearchDialogOpen}
          onClick={() => setIsSearchDialogOpen(true)}
        >
          <SearchIcon className="stroke-secondary-foreground" />
        </SidePanelButton>
        <SidePanelButton
          onClick={() => {
            setIsHiscoresOpen((v) => !v);
            setIsActivitiesOpen(false);
          }}
          isActive={isHiscoresOpen}
          isLoading={hiscoresQuery.isPending}
          isError={hiscoresQuery.isError}
          tooltip={
            hiscoresQuery.isError
              ? "Hiscores not found"
              : isHiscoresOpen
                ? "Close Hiscores panel"
                : "Open Hiscores panel"
          }
        >
          <img src={HiscoresIcon} width={25} height={25} />
        </SidePanelButton>
        <SidePanelButton
          onClick={() => {
            setIsActivitiesOpen((v) => !v);
            setIsHiscoresOpen(false);
          }}
          isActive={isActivitiesOpen}
          tooltip={
            isActivitiesOpen
              ? "Close Activities panel"
              : "Open Activities panel"
          }
        >
          <Activity className="size-6 stroke-secondary-foreground" />
        </SidePanelButton>

        <Link to="/info/discord-bot" className="mt-auto">
          <SidePanelButton className="group" tooltip="Discord Bot">
            <Bot className="size-6 group-hover:text-secondary-foreground" />
          </SidePanelButton>
        </Link>

        <SidePanelButton
          className="bg-primary group"
          tooltip="Join the Discord"
          onClick={() => window.open(DISCORD_INVITE_INK, "_blank")}
          role="link"
        >
          <DiscordIcon className="size-12 group-hover:text-secondary-foreground" />
        </SidePanelButton>

        <SidePanelButton
          className="bg-secondary group hover:bg-secondary/80"
          tooltip="Donate on Ko-fi"
          onClick={() => window.open("https://ko-fi.com/runeprofile", "_blank")}
          role="link"
        >
          <KofiIcon className="size-12 group-hover:text-primary-foreground" />
        </SidePanelButton>
      </div>
      <ErrorBoundary fallback={null}>
        <Sheet modal={false} open={isHiscoresOpen}>
          <SheetContent className="absolute p-0 right-16 max-w-[400px] backdrop-blur-md bg-card/50 z-40">
            <ScrollArea className="h-full shadow-2xl">
              <Hiscores username={username} className="pr-2" />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <Sheet modal={false} open={isActivitiesOpen}>
          <SheetContent className="absolute p-0 right-16 max-w-[400px] backdrop-blur-md bg-card/50 z-40">
            <ScrollArea className="h-full shadow-2xl">
              <ProfileActivities
                username={username}
                enabled={isActivitiesOpen}
                className="p-4"
              />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </ErrorBoundary>
    </>
  );
}

function SidePanelButton({
  className,
  tooltip,
  isActive,
  isLoading,
  isError,
  children,
  ...props
}: ButtonProps & {
  isActive?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  tooltip?: React.ReactNode;
}) {
  const RenderedButton = (
    <Button
      className={cn(
        "relative size-14 bg-accent hover:bg-secondary",
        isActive && "bg-secondary",
        isError && "cursor-not-allowed",
        className,
      )}
      disabled={isLoading}
      {...props}
      onClick={isError ? undefined : props.onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
          <LoaderCircle className="animate-spin size-8" />
        </div>
      )}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
          <X className="size-8 stroke-destructive" />
        </div>
      )}
      {children}
    </Button>
  );

  if (!!tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{RenderedButton}</TooltipTrigger>
        <TooltipContent side="left" className="z-[60]">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return RenderedButton;
}
