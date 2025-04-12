import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { COLLECTION_LOG_TABS } from "@runeprofile/runescape";

import HiscoresIcon from "~/assets/icons/hiscores.png";
import { Hiscores, hiscoresQueryOptions } from "~/components/hiscores";
import { AchievementDiaries } from "~/components/osrs/achievement-diaries";
import { Character } from "~/components/osrs/character";
import { CollectionLog } from "~/components/osrs/collection-log";
import { CombatAchievements } from "~/components/osrs/combat-achievements";
import { QuestList } from "~/components/osrs/quest-list";
import { Skills } from "~/components/osrs/skills";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { getProfile } from "~/lib/api";
import { HISCORE_ENDPOINTS, HiscoreEndpoint } from "~/lib/hiscores";

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

  const { data: profile } = useSuspenseQuery(
    profileQueryOptions(params.username),
  );

  const page = search.page || COLLECTION_LOG_PAGES[0];

  return (
    <div className="flex flex-row min-h-screen">
      <div className="flex flex-row flex-wrap gap-4 p-8 items-center justify-center max-w-[1280px] mx-auto flex-1 mr-16">
        <Character
          username={profile.username}
          accountType={profile.accountType}
          createdAt={new Date(profile.createdAt)}
          updatedAt={new Date(profile.updatedAt)}
          modelUri={`http://localhost:8787/profiles/models/${profile.username}`}
        />
        <Skills data={profile.skills} />
        <AchievementDiaries data={profile.achievementDiaryTiers} />
        <QuestList data={profile.quests} />
        <CombatAchievements data={profile.combatAchievementTiers} />
        <CollectionLog page={page} data={profile.items} />
      </div>
      <div className="flex flex-col w-16 bg-card border-l right-0 fixed h-screen z-[60]">
        <Sheet modal={false}>
          <SheetTrigger className="cursor-pointer hover:bg-accent/75 data-[state=open]:bg-accent z-[60]">
            <img src={HiscoresIcon} className="w-full p-4" />
          </SheetTrigger>
          <SheetContent className="p-0 right-16 max-w-[400px] backdrop-blur-md bg-card/50">
            <ScrollArea className="h-full shadow-2xl">
              <Hiscores className="pr-2" />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
