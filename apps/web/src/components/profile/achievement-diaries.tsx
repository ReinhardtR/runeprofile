import { ACHIEVEMENT_DIARIES } from "@runeprofile/runescape";

import AchievementDiaryIcon from "~/assets/icons/achievement-diaries.png";
import RuneScapeScrollContainer from "~/components/profile/runescape-scroll-container";
import { Profile } from "~/lib/api";
import { cn } from "~/lib/utils";

import { Card } from "../card";

const TIERS_NAMES = ["Easy", "Medium", "Hard", "Elite"];

export function AchievementDiaries({
  data,
}: {
  data: Profile["achievementDiaryTiers"];
}) {
  const areas: Array<{
    name: string;
    tiers: Array<{ name: string; completedCount: number; tasksCount: number }>;
  }> = [];

  for (const area of ACHIEVEMENT_DIARIES) {
    const tiers = area.tiers.map((tasksCount, i) => ({
      name: TIERS_NAMES[i],
      completedCount:
        data.find(
          (t) =>
            t.id === area.id &&
            t.tier?.toLowerCase() === TIERS_NAMES[i].toLowerCase(),
        )?.completedCount ?? 0,
      tasksCount,
    }));

    areas.push({
      name: area.name,
      tiers,
    });
  }

  return (
    <Card icon={AchievementDiaryIcon} className="shrink-0">
      <RuneScapeScrollContainer
        className="border-2 border-osrs-dark-border"
        contentClassName="text-yellow-osrs flex flex-col space-y-[2px] p-1 font-runescape text-lg leading-tight"
      >
        {areas.map((area) => {
          const tasksCompleted = area.tiers.reduce(
            (count, tier) => count + tier.completedCount,
            0,
          );

          const tasksTotal = area.tiers.reduce(
            (count, tier) => count + tier.tasksCount,
            0,
          );

          let areaProgressClass = "text-osrs-yellow";

          const notStarted = area.tiers.every(
            (tier) => tier.completedCount == 0,
          );

          if (notStarted) areaProgressClass = "text-osrs-red";

          const isCompleted = area.tiers.every(
            (tier) => tier.tasksCount == tier.completedCount,
          );

          if (isCompleted) areaProgressClass = "text-osrs-green";

          return (
            <div
              key={area.name}
              className="rounded-xs border-2 border-osrs-dark-border p-[2px]"
            >
              <div
                className={cn(
                  "flex justify-between solid-text-shadow",
                  areaProgressClass,
                )}
              >
                <p>{area.name}</p>
                <p className="text-base">
                  {tasksCompleted}/{tasksTotal}
                </p>
              </div>
              <div className="flex shadow">
                {area.tiers.map((tier) => {
                  const percentageCompleted = Math.floor(
                    (tier.completedCount / tier.tasksCount) * 100,
                  );

                  let tierProgressClass = "bg-osrs-green";

                  if (percentageCompleted == 0) {
                    tierProgressClass = "bg-osrs-red";
                  } else if (percentageCompleted <= 33) {
                    tierProgressClass = "bg-osrs-diary-low";
                  } else if (percentageCompleted <= 66) {
                    tierProgressClass = "bg-osrs-diary-med";
                  } else if (percentageCompleted <= 99) {
                    tierProgressClass = "bg-osrs-diary-high";
                  }

                  return (
                    <div
                      className="h-[10px] w-1/4 rounded-none border-2 border-r-0 border-black last:border-r-2"
                      key={area + tier.name}
                    >
                      <div
                        className={cn("h-full", tierProgressClass)}
                        style={{
                          width: `${percentageCompleted}%`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </RuneScapeScrollContainer>
    </Card>
  );
}
