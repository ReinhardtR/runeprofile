import { COMBAT_ACHIEVEMENT_TIERS } from "@runeprofile/runescape";

import CombatAchievementsIcon from "~/assets/icons/combat-achievements.png";
import { Profile } from "~/lib/api";
import { cn } from "~/lib/utils";

import { Card } from "./card";

export function CombatAchievements({
  data,
}: {
  data: Profile["combatAchievementTiers"];
}) {
  const tiers: Array<{
    name: string;
    tasksCount: number;
    completedCount: number;
  }> = [];

  for (const tier of COMBAT_ACHIEVEMENT_TIERS) {
    const tierData = data.find((t) => t.id === tier.id);
    tiers.push({
      name: tier.name,
      tasksCount: tier.tasksCount,
      completedCount: tierData?.completedCount ?? 0,
    });
  }

  return (
    <Card icon={CombatAchievementsIcon} className="shrink-0">
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-1 p-1 shadow">
        {tiers.map((tier) => {
          const percentageCompleted = Math.floor(
            (tier.completedCount / tier.tasksCount) * 100,
          );

          let tierColor = "text-osrs-yellow";

          if (percentageCompleted == 0) {
            tierColor = "text-osrs-gray";
          } else if (percentageCompleted == 100) {
            tierColor = "text-osrs-green";
          }

          return (
            <div
              key={tier.name}
              className="runescape-corners-border flex flex-col items-center justify-center bg-white/3 font-runescape"
            >
              <p className="text-lg leading-none text-osrs-orange solid-text-shadow">
                {tier.name}
              </p>
              <div className="relative my-[1px]">
                <img
                  src={
                    new URL(
                      `../../assets/combat-achievements/${tier.name.toLowerCase()}.png`,
                      import.meta.url,
                    ).href
                  }
                  alt={tier.name}
                  width={38}
                  height={38}
                  className="drop-shadow-xl"
                />
              </div>
              <p
                className={cn(
                  "text-sm leading-none solid-text-shadow",
                  tierColor,
                )}
              >
                {tier.completedCount}/{tier.tasksCount}
              </p>
              <div className="relative z-20 h-[10px] w-full rounded-none border-2 border-black shadow">
                {/* Segment Lines */}
                <div className="absolute left-1/4 z-20 h-full border-l-2 border-black " />
                <div className="absolute left-1/2 z-20 h-full border-l-2 border-black" />
                <div className="absolute left-3/4 z-20 h-full border-l-2 border-black" />
                {/* Progress bar */}
                <div
                  className={cn(
                    "z-10 h-full",
                    percentageCompleted == 100
                      ? "bg-osrs-green"
                      : "bg-osrs-yellow",
                  )}
                  style={{
                    width: `${percentageCompleted}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
