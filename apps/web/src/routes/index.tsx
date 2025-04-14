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
import { AchievementDiaries } from "~/components/osrs/achievement-diaries";
import { Character } from "~/components/osrs/character";
import { CollectionLog } from "~/components/osrs/collection-log";
import { CombatAchievements } from "~/components/osrs/combat-achievements";
import { QuestList } from "~/components/osrs/quest-list";
import { Skills } from "~/components/osrs/skills";
import { isSearchDialogOpenAtom } from "~/components/search-dialog";
import { Button } from "~/components/ui/button";
import { Profile } from "~/lib/api";
import { cn } from "~/lib/utils";
import { SidePanel } from "~/routes/$username";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const setIsSearchDialogOpen = useSetAtom(isSearchDialogOpenAtom);

  const dataTypeList = [
    { name: "Skills", icon: SkillsIcon },
    { name: "Quests", icon: QuestIcon },
    { name: "Achievement Diaries", icon: AchievementDiariesIcon },
    { name: "Combat Achievements", icon: CombatAchievementsIcon },
    { name: "Collection Log", icon: CollectionLogIcon },
    { name: "Hiscores", icon: HiscoresIcon },
  ];

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
              className="min-h-screen w-full object-cover mix-blend-multiply"
            />
          </div>
        </div>

        <ProfilePreview />
      </div>
      <Footer />
    </>
  );
}

function ProfilePreview() {
  const profile = PgnProfileSnapshot as Profile;

  const [page, setPage] = React.useState(COLLECTION_LOG_TABS[0].pages[0].name);

  return (
    <div className="flex flex-row items-stretch min-h-screen relative overflow-x-hidden">
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
          username={profile.username}
          page={page}
          onPageChange={setPage}
          data={profile.items}
        />
      </div>

      <SidePanel username={profile.username} />
    </div>
  );
}
