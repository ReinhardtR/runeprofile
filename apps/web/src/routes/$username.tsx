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
import { LoaderCircle, SearchIcon, X } from "lucide-react";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { z } from "zod";

import { COLLECTION_LOG_TABS } from "@runeprofile/runescape";

import { Profile, RuneProfileApiError, getProfile } from "~/core/api";
import HiscoresIcon from "~/core/assets/icons/hiscores.png";
import Logo from "~/core/assets/misc/logo.png";
import { DISCORD_INVITE_INK } from "~/core/constants";
import {
  Character,
  CollectionLog,
  DataTabsCard,
  Hiscores,
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
import { cn } from "~/shared/utils";

function profileQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["profile", { username }],
    queryFn: () => getProfile({ username }),
  });
}

const COLLECTION_LOG_PAGES: string[] = COLLECTION_LOG_TABS.map((tab) =>
  tab.pages.map((p) => p.name.toLowerCase()),
).flat();

const profileSearchSchema = z.object({
  page: z
    .string()
    .transform((value) => value.toLowerCase())
    .refine((value) => COLLECTION_LOG_PAGES.includes(value))
    .optional()
    .catch(undefined),
});

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

  return (
    <>
      <div className="flex flex-row items-stretch min-h-screen overflow-x-hidden relative">
        <ProfileContent
          profile={profile}
          page={page}
          onPageChange={(newPage) =>
            navigate({ search: { page: newPage }, resetScroll: false })
          }
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
  onPageChange,
}: {
  profile: Profile;
  page: string;
  onPageChange: (page: string) => void;
}) {
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
          skills={profile.skills}
          quests={profile.quests}
          achievementDiaries={profile.achievementDiaryTiers}
          combatAchievements={profile.combatAchievementTiers}
        />
      </div>

      <div className="flex flex-row items-center justify-center flex-wrap xl:flex-nowrap xl:flex-col gap-6 lg:w-[680px]">
        <CollectionLog
          username={profile.username}
          page={page}
          onPageChange={onPageChange}
          data={profile.items}
        />
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
          onClick={() => setIsHiscoresOpen((v) => !v)}
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
          className="bg-primary mt-auto group"
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
