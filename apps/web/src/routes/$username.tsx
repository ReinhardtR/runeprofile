import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import {
  COLLECTION_LOG_TABS,
  getCombatLevel,
  getLevelFromXP,
} from "@runeprofile/runescape";

import { AchievementDiaries } from "~/components/profile/achievement-diaries";
import { Character } from "~/components/profile/character";
import { CollectionLog } from "~/components/profile/collection-log";
import { CombatAchievements } from "~/components/profile/combat-achievements";
import { QuestList } from "~/components/profile/quest-list";
import { Skills } from "~/components/profile/skills";
import { getProfile } from "~/lib/api";
import { getSkillXp } from "~/lib/utils";

function profileQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["profile", { username }],
    queryFn: () => getProfile({ username }),
    staleTime: Infinity,
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
    .optional(),
});

export const Route = createFileRoute("/$username")({
  component: RouteComponent,
  validateSearch: zodValidator(profileSearchSchema),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ params, context }) => {
    return Promise.all([
      // todo: add prefetch for clog page
      context.queryClient.prefetchQuery(profileQueryOptions(params.username)),
    ]);
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-8 items-center">
        <div className="flex flex-row flex-wrap gap-8 p-8 flex-1">
          <Character
            username={profile.username}
            accountType={profile.accountType}
            combatLevel={getCombatLevel({
              attack: getLevelFromXP(getSkillXp(profile.skills, "Attack")),
              strength: getLevelFromXP(getSkillXp(profile.skills, "Strength")),
              defence: getLevelFromXP(getSkillXp(profile.skills, "Defence")),
              hitpoints: getLevelFromXP(
                getSkillXp(profile.skills, "Hitpoints"),
              ),
              ranged: getLevelFromXP(getSkillXp(profile.skills, "Ranged")),
              prayer: getLevelFromXP(getSkillXp(profile.skills, "Prayer")),
              magic: getLevelFromXP(getSkillXp(profile.skills, "Magic")),
            })}
            createdAt={new Date(profile.createdAt)}
            updatedAt={new Date(profile.updatedAt)}
            modelUri={`http://localhost:8787/profiles/models/${profile.username}`}
          />
          <Skills data={profile.skills} />
          <AchievementDiaries data={profile.achievementDiaryTiers} />
          <QuestList data={profile.quests} />
          <CombatAchievements data={profile.combatAchievementTiers} />
        </div>
        <CollectionLog page={page} data={profile.items} />
      </div>
    </div>
  );
}
