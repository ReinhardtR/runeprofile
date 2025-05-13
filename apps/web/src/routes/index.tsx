import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Search } from "lucide-react";
import React from "react";

import {
  COLLECTION_LOG_ITEMS,
  COLLECTION_LOG_TABS,
} from "@runeprofile/runescape";

import ITEM_ICONS from "~/assets/item-icons.json";
import Logo from "~/assets/misc/logo.png";
import QuestionMarkImage from "~/assets/misc/question-mark.png";
import RuneLiteLogo from "~/assets/misc/runelite-logo.png";
import PgnProfileSnapshot from "~/assets/pgn-profile-snapshot.json";
// import HeroImage from "~/assets/misc/hero-image.png";
import YamaImage from "~/assets/yama.jpeg";
import { Footer } from "~/components/footer";
import { isSearchDialogOpenAtom } from "~/components/search-dialog";
import { Button } from "~/components/ui/button";
import { Profile, getYamaLeaderboard } from "~/lib/api";
import { base64ImgSrc, cn } from "~/lib/utils";
import { ProfileContent, SidePanel } from "~/routes/$username";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const setIsSearchDialogOpen = useSetAtom(isSearchDialogOpenAtom);

  const yamaLeaderboardQuery = useQuery({
    queryKey: ["yama-leaderboard"],
    queryFn: getYamaLeaderboard,
  });

  return (
    <>
      <div className="flex flex-col">
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

          <div className="lg:min-w-[500px] left-4 lg:left-auto top-32 bottom-32 lg:top-4 lg:bottom-4 right-4 absolute z-30 bg-background/80 p-2 rounded-2xl gap-y-1 flex flex-col max-h-full overflow-y-auto">
            <p className="text-lg text-center font-bold text-secondary-foreground">
              Yama Oathplate Leaderboard
            </p>
            {yamaLeaderboardQuery.data?.map((player, index) => (
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
                      ITEM_ICONS[item.id as unknown as keyof typeof ITEM_ICONS];
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
                          <p className="absolute top-0 left-0 z-20 text-osrs-yellow text-lg solid-text-shadow">
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
          </div>

          <div className="absolute z-20">
            <img src={YamaImage} className="h-screen w-screen object-cover" />
          </div>
        </div>

        <ProfileExample />
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
      <p className="absolute left-0 right-0 top-4 text-muted-foreground flex-1 text-center font-medium">
        Profile Example
      </p>
      <ProfileContent profile={profile} page={page} onPageChange={setPage} />
      <SidePanel username={profile.username} />
    </div>
  );
}
