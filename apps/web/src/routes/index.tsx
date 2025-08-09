import { queryOptions } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Search } from "lucide-react";
import React from "react";

import { COLLECTION_LOG_TABS } from "@runeprofile/runescape";

import AchievementDiariesIcon from "~/assets/icons/achievement-diaries.png";
import CollectionLogIcon from "~/assets/icons/collection-log.png";
import CombatAchievementsIcon from "~/assets/icons/combat-achievements.png";
import HiscoresIcon from "~/assets/icons/hiscores.png";
import QuestIcon from "~/assets/icons/quest.png";
import SkillsIcon from "~/assets/icons/skills.png";
import HeroImage from "~/assets/misc/hero-image.png";
import RuneLiteLogo from "~/assets/misc/runelite-logo.png";
import PgnProfileSnapshot from "~/assets/pgn-profile-snapshot.json";
import { Footer } from "~/components/footer";
import { isSearchDialogOpenAtom } from "~/components/search-dialog";
import { Button } from "~/components/ui/button";
import { Profile, getMetrics } from "~/lib/api";
import { cn } from "~/lib/utils";
import { ProfileContent, SidePanel } from "~/routes/$username";

function metricsQueryOptions() {
  return queryOptions({
    queryKey: ["metrics"],
    queryFn: () => getMetrics(),
  });
}

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(metricsQueryOptions());
  },
});

function RouteComponent() {
  const setIsSearchDialogOpen = useSetAtom(isSearchDialogOpenAtom);

  const profilePreviewRef = React.useRef<HTMLDivElement>(null);

  const dataTypeList = [
    { name: "Skills", icon: SkillsIcon },
    { name: "Quests", icon: QuestIcon },
    { name: "Achievement Diaries", icon: AchievementDiariesIcon },
    { name: "Combat Achievements", icon: CombatAchievementsIcon },
    { name: "Collection Log", icon: CollectionLogIcon },
    { name: "Hiscores", icon: HiscoresIcon },
  ];

  const scrollToProfilePreview = () => {
    profilePreviewRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="flex flex-col">
        <div className="flex min-h-screen flex-col justify-between border-b border-primary bg-background shadow shadow-accent">
          <div className="z-30 flex flex-1 flex-col items-center pt-[20vh]">
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
                "flex h-12 transform items-center justify-center gap-x-2 rounded-full border border-primary bg-black/75 px-4 py-1.5 text-base font-medium shadow transition-all hover:scale-110 hover:bg-black/75 mb-4",
              )}
              onClick={() => setIsSearchDialogOpen(true)}
            >
              <Search className="mr-1 h-5 w-5" />
              <span className="inline-flex">Search profiles</span>
            </Button>
            <Link
              to="/info/guide"
              className="flex transform items-center justify-center space-x-2 rounded-full border border-secondary-foreground bg-black/75 px-4 py-1.5 font-medium shadow transition-all hover:scale-110"
            >
              <img src={RuneLiteLogo} alt="RuneLite" width={32} height={32} />
              <span>Plugin Guide</span>
            </Link>
          </div>
          <div className="absolute z-20 bg-primary">
            <img
              src={HeroImage}
              className="h-screen w-screen object-cover mix-blend-multiply"
            />
          </div>
          <Button
            className="absolute bottom-8 left-1/2 z-40 -translate-x-1/2 text-foreground animate-in fade-in-10 duration-[2000ms]"
            onClick={scrollToProfilePreview}
            variant="link"
          >
            Scroll to Profile Example
          </Button>
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

  const [page, setPage] = React.useState(COLLECTION_LOG_TABS[0].pages[0].name);

  return (
    <div
      className={cn(
        "flex flex-row items-stretch min-h-screen relative overflow-x-hidden",
        className,
      )}
      {...props}
    >
      <ProfileContent profile={profile} page={page} onPageChange={setPage} />
      <SidePanel username={profile.username} />
    </div>
  );
}
