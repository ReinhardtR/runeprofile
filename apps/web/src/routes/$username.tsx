import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useAtom } from "jotai";
import { SearchIcon } from "lucide-react";
import React from "react";
import { z } from "zod";

import { COLLECTION_LOG_TABS } from "@runeprofile/runescape";

import HiscoresIcon from "~/assets/icons/hiscores.png";
import Logo from "~/assets/misc/logo.png";
import { Footer } from "~/components/footer";
import { Hiscores, hiscoresQueryOptions } from "~/components/hiscores";
import { AchievementDiaries } from "~/components/osrs/achievement-diaries";
import { Character } from "~/components/osrs/character";
import { CollectionLog } from "~/components/osrs/collection-log";
import { CombatAchievements } from "~/components/osrs/combat-achievements";
import { QuestList } from "~/components/osrs/quest-list";
import { Skills } from "~/components/osrs/skills";
import { isSearchDialogOpenAtom } from "~/components/search-dialog";
import { Button, ButtonProps } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { getProfile } from "~/lib/api";
import { HISCORE_ENDPOINTS, HiscoreEndpoint } from "~/lib/hiscores";
import { cn } from "~/lib/utils";

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
  validateSearch: zodValidator(profileSearchSchema),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ params, context }) => {
    if (params.username !== "pgn") {
      return redirect({ to: "/" });
    }

    for (const hiscoreEndpoint of Object.keys(HISCORE_ENDPOINTS)) {
      context.queryClient.prefetchQuery(
        hiscoresQueryOptions({
          username: params.username,
          endpoint: hiscoreEndpoint as HiscoreEndpoint,
        }),
      );
    }

    return context.queryClient.prefetchQuery(
      profileQueryOptions(params.username),
    );
  },
});

function RouteComponent() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: profile } = useSuspenseQuery(
    profileQueryOptions(params.username),
  );

  const page = search.page || COLLECTION_LOG_PAGES[0];

  return (
    <>
      <div className="flex flex-row items-stretch min-h-screen">
        <div className="flex flex-row flex-wrap gap-4 px-6 py-12 items-center justify-center max-w-[1280px] mx-auto flex-1">
          <Character
            username={profile.username}
            accountType={profile.accountType}
            createdAt={new Date(profile.createdAt)}
            updatedAt={new Date(profile.updatedAt)}
          />
          <Skills data={profile.skills} />
          <AchievementDiaries data={profile.achievementDiaryTiers} />
          <QuestList data={profile.quests} />
          <CombatAchievements data={profile.combatAchievementTiers} />
          <CollectionLog
            page={page}
            onPageChange={(newPage) =>
              navigate({ search: { page: newPage }, resetScroll: false })
            }
            data={profile.items}
          />
        </div>

        <SidePanel />
      </div>
      <Footer />
    </>
  );
}

function SidePanel() {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useAtom(
    isSearchDialogOpenAtom,
  );
  const [isHiscoresOpen, setIsHiscoresOpen] = React.useState(false);

  return (
    <>
      <div className="w-16 bg-card flex flex-col items-center py-2 z-50 gap-y-2">
        <Link to="/">
          <SidePanelButton className="p-0" tooltip="Home page">
            <img src={Logo} className="w-full h-full" />
          </SidePanelButton>
        </Link>

        <SidePanelButton
          tooltip="Search for a player"
          active={isSearchDialogOpen}
          onClick={() => setIsSearchDialogOpen(true)}
        >
          <SearchIcon className="stroke-secondary-foreground" />
        </SidePanelButton>
        <SidePanelButton
          onClick={() => setIsHiscoresOpen((v) => !v)}
          active={isHiscoresOpen}
          tooltip={
            isHiscoresOpen ? "Close Hiscores panel" : "Open Hiscores panel"
          }
        >
          <img src={HiscoresIcon} width={25} height={25} />
        </SidePanelButton>
      </div>

      <Sheet modal={false} open={isHiscoresOpen}>
        <SheetContent className="absolute overflow-hidden p-0 right-16 max-w-[400px] backdrop-blur-md bg-card/50 z-40">
          <ScrollArea className="h-full shadow-2xl">
            <Hiscores className="pr-2" />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

function SidePanelButton({
  className,
  tooltip,
  active,
  ...props
}: ButtonProps & {
  active?: boolean;
  tooltip?: React.ReactNode;
}) {
  const RenderedButton = (
    <Button
      className={cn(
        "size-14 bg-accent hover:bg-secondary",
        active && "bg-secondary",
        className,
      )}
      {...props}
    />
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
