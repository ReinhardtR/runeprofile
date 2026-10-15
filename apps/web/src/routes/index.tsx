import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Bot, Search } from "lucide-react";
import React from "react";

import {
  COLLECTION_LOG_TABS,
  FRONTPAGE_EVENT,
  isFrontpageEventLive,
} from "@runeprofile/runescape";

import { Profile } from "~/core/api";
import AchievementDiariesIcon from "~/core/assets/icons/achievement-diaries.png";
import CollectionLogIcon from "~/core/assets/icons/collection-log.png";
import CombatAchievementsIcon from "~/core/assets/icons/combat-achievements.png";
import HiscoresIcon from "~/core/assets/icons/hiscores.png";
import QuestIcon from "~/core/assets/icons/quest.png";
import SkillsIcon from "~/core/assets/icons/skills.png";
import HeroImage from "~/core/assets/misc/hero-image.png";
import RuneLiteLogo from "~/core/assets/misc/runelite-logo.png";
import PgnProfileSnapshot from "~/core/assets/pgn-profile-snapshot.json";
import {
  EventHero,
  eventLeaderboardsQueryOptions,
  metricsQueryOptions,
} from "~/features/frontpage-event";
import { isSearchDialogOpenAtom } from "~/features/search";
import { Footer } from "~/layouts";
import { ProfileContent, ProfileSearch, SidePanel } from "~/routes/$username";
import { Button } from "~/shared/components/ui/button";
import { Separator } from "~/shared/components/ui/separator";
import { cn, numberWithDelimiter } from "~/shared/utils";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    // Awaited so the data is dehydrated into the SSR payload — a
    // fire-and-forget prefetch renders on the server but hydrates as
    // undefined, causing a hydration mismatch on the stat counters.
    await Promise.all([
      context.queryClient.prefetchQuery(metricsQueryOptions()),
      FRONTPAGE_EVENT &&
        isFrontpageEventLive(FRONTPAGE_EVENT) &&
        context.queryClient.prefetchQuery(eventLeaderboardsQueryOptions()),
    ]);
  },
});

function RouteComponent() {
  const profilePreviewRef = React.useRef<HTMLDivElement>(null);

  const scrollToProfilePreview = () => {
    profilePreviewRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="flex flex-col">
        <div className="relative flex min-h-[max(100vh,700px)] flex-col border-b border-primary bg-background shadow shadow-accent">
          {FRONTPAGE_EVENT ? (
            <EventHero event={FRONTPAGE_EVENT} />
          ) : (
            <DefaultHero scrollToProfilePreview={scrollToProfilePreview} />
          )}
        </div>

        <ProfileExample ref={profilePreviewRef} />
      </div>
      <Footer />
    </>
  );
}

function ProfileExample({
  className,
  ...props
}: React.HTMLProps<HTMLDivElement>) {
  const profile = PgnProfileSnapshot as Profile;

  const [search, setSearch] = React.useState<ProfileSearch>({});

  const page = search.page || COLLECTION_LOG_TABS[0].pages[0].name;

  const updateSearch = React.useCallback((updates: Partial<ProfileSearch>) => {
    setSearch((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div
      className={cn(
        "flex flex-row items-stretch min-h-screen relative overflow-x-hidden",
        className,
      )}
      {...props}
    >
      <ProfileContent
        profile={profile}
        page={page}
        search={search}
        updateSearch={updateSearch}
      />
      <SidePanel username={profile.username} />
    </div>
  );
}

function DefaultHero({
  scrollToProfilePreview,
}: {
  scrollToProfilePreview: () => void;
}) {
  const setIsSearchDialogOpen = useSetAtom(isSearchDialogOpenAtom);

  const { data: metrics } = useQuery(metricsQueryOptions());

  const dataTypeList = [
    { name: "Skills", icon: SkillsIcon },
    { name: "Quests", icon: QuestIcon },
    { name: "Achievement Diaries", icon: AchievementDiariesIcon },
    { name: "Combat Achievements", icon: CombatAchievementsIcon },
    { name: "Collection Log", icon: CollectionLogIcon },
    { name: "Hiscores", icon: HiscoresIcon },
  ];

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="z-30 flex flex-1 flex-col items-center justify-center py-12 gap-y-3">
        <div className="mb-16 mt-12 flex flex-col items-center justify-center space-y-2">
          <h1 className="text-5xl font-extrabold drop-shadow-solid md:text-6xl lg:text-7xl">
            <span className="text-secondary-foreground/90 solid-text-shadow">
              RUNE
            </span>
            <span className="text-primary solid-text-shadow">PROFILE</span>
          </h1>
          <p className="text-md text-light-gray font-medium drop-shadow-solid-sm md:text-lg lg:text-xl">
            Share your Old School RuneScape achievements
          </p>
          <div className="mb-6 flex items-center justify-center space-x-4 rounded-full bg-black/75 px-5 py-3  shadow">
            {dataTypeList.map((type) => (
              <img
                src={type.icon}
                alt={type.name}
                key={type.name}
                width={32}
                height={32}
                className="drop-shadow-solid-sm"
              />
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          className={cn(
            "flex h-12 transform items-center justify-center gap-x-2 rounded-full border border-primary bg-black/75 px-4 py-1.5 text-base font-medium shadow transition-all hover:scale-110 hover:bg-black/75",
          )}
          onClick={() => setIsSearchDialogOpen(true)}
        >
          <Search className="mr-1 h-5 w-5" />
          <span className="inline-flex">Search profiles</span>
        </Button>
        <Link
          to="/info/guide"
          className="flex h-12 transform items-center justify-center space-x-2 rounded-full border border-secondary-foreground bg-black/75 px-4 py-1.5 font-medium shadow transition-all hover:scale-110"
        >
          <img src={RuneLiteLogo} alt="RuneLite" width={32} height={32} />
          <span>Plugin Guide</span>
        </Link>
        <Link
          to="/info/discord-bot"
          className="flex h-12 transform items-center justify-center space-x-2 rounded-full border border-secondary-foreground bg-black/75 px-4 py-1.5 font-medium shadow transition-all hover:scale-110"
        >
          <Bot className="h-5 w-5" />
          <span>Discord Bot</span>
        </Link>
      </div>

      <div className="absolute inset-0 z-20 bg-primary/90">
        <img
          src={HeroImage}
          className="h-full w-full object-cover mix-blend-multiply"
        />
      </div>

      <div className="z-30 flex flex-col items-center gap-y-4 pb-8">
        <div
          className={cn(
            "flex-row items-center justify-center gap-x-6 bg-background/80 py-3 px-6 rounded-3xl transition-opacity duration-700 flex",
            !!metrics
              ? "opacity-100 animate-in fade-in"
              : "opacity-0 pointer-events-none",
          )}
        >
          <div className="flex flex-col gap-y-1 items-center justify-center w-34">
            <p className="text-secondary-foreground font-bold text-3xl solid-text-shadow">
              {numberWithDelimiter(metrics?.totalAccounts || 0)}
            </p>
            <p className="font-bold text-primary">Profiles</p>
          </div>
          <Separator className="h-14" orientation="vertical" />
          <div className="flex flex-col gap-y-1 items-center justify-center w-40">
            <p className="text-secondary-foreground font-bold text-3xl solid-text-shadow">
              {numberWithDelimiter(metrics?.totalActivities || 0)}
            </p>
            <p className="font-bold text-primary">Activities</p>
          </div>
        </div>

        <Button
          className="text-foreground animate-in fade-in-10 duration-[2000ms]"
          onClick={scrollToProfilePreview}
          variant="link"
        >
          Scroll to Profile Example
        </Button>
      </div>
    </div>
  );
}
