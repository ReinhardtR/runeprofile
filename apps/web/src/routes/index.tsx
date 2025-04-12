import { createFileRoute } from "@tanstack/react-router";

import { AchievementDiaries } from "~/components/osrs/achievement-diaries";
import { CombatAchievements } from "~/components/osrs/combat-achievements";
import { QuestList } from "~/components/osrs/quest-list";
import { Skills } from "~/components/osrs/skills";
import { getProfile } from "~/lib/api";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: () => getProfile({ username: "pgn" }),
});

function RouteComponent() {
  const profile = Route.useLoaderData();

  return (
    <div className="flex flex-row items-center justify-center gap-4 p-16">
      <Skills data={profile.skills} />
      <AchievementDiaries data={profile.achievementDiaryTiers} />
      <QuestList data={profile.quests} />
      <CombatAchievements data={profile.combatAchievementTiers} />
    </div>
  );
}
