import { queryOptions, useQuery } from "@tanstack/react-query";
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
import ITEM_ICONS from "~/assets/item-icons.json";
// import HeroImage from "~/assets/misc/hero-image.png";
import EventHeroImage from "~/assets/misc/event-hero-image.webp";
import Logo from "~/assets/misc/logo.png";
import QuestionMarkImage from "~/assets/misc/question-mark.png";
import RuneLiteLogo from "~/assets/misc/runelite-logo.png";
import PgnProfileSnapshot from "~/assets/pgn-profile-snapshot.json";
import { Footer } from "~/components/footer";
import { isSearchDialogOpenAtom } from "~/components/search-dialog";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Profile, getMetrics } from "~/lib/api";
import { base64ImgSrc, cn, numberWithDelimiter } from "~/lib/utils";
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

  const { data: metrics } = useQuery(metricsQueryOptions());

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
        {/* NORMAL HERO */}
        {/* <div className="flex min-h-screen flex-col justify-between border-b border-primary bg-background shadow shadow-accent">
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
        </div> */}

        {/* EVENT HERO */}
        <div className="flex min-h-screen flex-col justify-between border-b border-primary bg-background shadow shadow-accent">
          <div className="z-30 flex flex-row items-center justify-center gap-x-4 absolute top-4 left-4 bg-background/80 p-4 rounded-3xl">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <img
                src={Logo}
                alt="Logo"
                width={50}
                height={50}
                className="drop-shadow"
              />
              <p className="flex-col text-2xl font-black leading-none tracking-wide drop-shadow flex">
                <span className="text-primary">RUNE</span>
                <span className="text-secondary-foreground">PROFILE</span>
              </p>
            </Link>
          </div>

          <div
            className={cn(
              "z-30 flex-row items-center justify-center gap-x-8 absolute bottom-28 left-4 bg-background/80 p-4 rounded-3xl transition-opacity duration-700 hidden lg:flex",
              !!metrics
                ? "opacity-100 animate-in fade-in"
                : "opacity-0 pointer-events-none",
            )}
          >
            <div className="flex flex-col gap-y-1">
              <p className="text-secondary-foreground font-bold text-3xl solid-text-shadow">
                {numberWithDelimiter(metrics?.totalAccounts || 0)}
              </p>
              <p className="font-bold text-primary">Profiles</p>
            </div>
            <div className="flex flex-col gap-y-1">
              <p className="text-secondary-foreground font-bold text-3xl solid-text-shadow">
                {numberWithDelimiter(metrics?.totalActivities || 0)}
              </p>
              <p className="font-bold text-primary">Activities</p>
            </div>
          </div>

          <div className="z-30 flex flex-row items-center justify-center gap-x-4 absolute bottom-4 left-4 bg-background/80 p-4 rounded-3xl">
            <Button
              variant="outline"
              className={cn(
                "flex h-12 transform items-center justify-center gap-x-2 rounded-2xl border border-primary bg-black/75 px-4 py-1.5 text-base font-medium shadow transition-all hover:bg-black/75",
              )}
              onClick={() => setIsSearchDialogOpen(true)}
            >
              <Search className="mr-1 h-5 w-5" />
              <span className="inline-flex">Search profiles</span>
            </Button>
            <Link
              to="/info/guide"
              className="flex transform items-center justify-center space-x-2 rounded-2xl border border-secondary-foreground bg-black/75 px-4 py-1.5 font-medium shadow transition-all h-12"
            >
              <img src={RuneLiteLogo} alt="RuneLite" width={32} height={32} />
              <span>Plugin Guide</span>
            </Link>
          </div>

          <div className="lg:min-w-[500px] left-4 lg:left-auto top-32 bottom-32 lg:top-4 lg:bottom-4 right-4 absolute z-30">
            <ScrollArea className="gap-y-1 flex flex-col p-2 bg-background/80 rounded-2xl flex-1 max-h-full">
              <p className="text-lg text-center font-bold text-secondary-foreground solid-text-shadow">
                Doom of Mokhaiotl Leaderboard
              </p>
              <div className="absolute inset-0 bg-background/85 rounded-lg flex items-center justify-center z-30 pointer-events-none">
                <p className="text-center text-xl text-primary font-bold my-auto solid-text-shadow">
                  Coming soon...
                </p>
              </div>
              {[
                {
                  username: "Player",
                  items: [
                    { id: "item1", quantity: 4 },
                    { id: "item2", quantity: 5 },
                    { id: "item2", quantity: 2 },
                    { id: "item2", quantity: 1 },
                  ],
                },
                {
                  username: "Player",
                  items: [
                    { id: "item3", quantity: 2 },
                    { id: "item4", quantity: 3 },
                    { id: "item2", quantity: 1 },
                  ],
                },
                {
                  username: "Player",
                  items: [
                    { id: "item5", quantity: 1 },
                    { id: "item6", quantity: 2 },
                  ],
                },
                {
                  username: "Player",
                  items: [
                    { id: "item5", quantity: 1 },
                    { id: "item2", quantity: 1 },
                  ],
                },
                {
                  username: "Player",
                  items: [
                    { id: "item5", quantity: 1 },
                    { id: "item2", quantity: 1 },
                  ],
                },
                {
                  username: "Player",
                  items: [{ id: "item5", quantity: 1 }],
                },
                {
                  username: "Player",
                  items: [{ id: "item5", quantity: 1 }],
                },
                {
                  username: "Player",
                  items: [{ id: "item5", quantity: 1 }],
                },
                {
                  username: "Player",
                  items: [{ id: "item5", quantity: 1 }],
                },
                {
                  username: "Player",
                  items: [{ id: "item5", quantity: 1 }],
                },
              ].map((player, index) => (
                <Link
                  to="/$username"
                  params={{
                    username: player.username,
                  }}
                  className="bg-background/80 rounded-lg shadow flex flex-row items-center gap-x-4 px-4 py-2"
                >
                  <p
                    className={cn(
                      "text-xl font-bold font-runescape",
                      index === 0 && "text-[#FFD700]",
                      index === 1 && "text-[#C0C0C0]",
                      index === 2 && "text-[#CD7F32]",
                    )}
                  >
                    {index + 1}.
                  </p>
                  <p
                    className={cn(
                      "font-runescape font-bold text-2xl solid-text-shadow",
                      index === 0 && "text-[#FFD700]",
                      index === 1 && "text-[#C0C0C0]",
                      index === 2 && "text-[#CD7F32]",
                    )}
                  >
                    {player.username}
                  </p>
                  <div className="ml-auto flex flex-row items-center gap-x-2">
                    {player.items.map((item) => {
                      const itemIcon =
                        ITEM_ICONS[
                          item.id as unknown as keyof typeof ITEM_ICONS
                        ];
                      const iconSrc = itemIcon
                        ? base64ImgSrc(itemIcon)
                        : QuestionMarkImage;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "relative flex flex-row items-center justify-center",
                          )}
                        >
                          {item.quantity > 1 && (
                            <p className="absolute top-0 left-0 z-20 text-osrs-yellow text-lg solid-text-shadow font-runescape">
                              {item.quantity}
                            </p>
                          )}
                          <img
                            src={iconSrc}
                            className={cn(
                              "z-10 drop-shadow-2xl brightness-[0.85] size-[54px] object-contain",
                              !item.quantity && "opacity-30",
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </Link>
              ))}
            </ScrollArea>
          </div>

          <div className="absolute z-20">
            <img
              src={EventHeroImage}
              className="h-screen w-screen object-cover"
            />
          </div>
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
