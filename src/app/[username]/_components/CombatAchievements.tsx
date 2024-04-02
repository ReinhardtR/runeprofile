import { capitalize } from "~/lib/utils/capitalize-string";
import Image from "next/image";
import { Card } from "../../../components/Card";
import { type CombatAchievements as CombatAchievementsType } from "~/lib/domain/profile-data-types";
import { cn } from "~/lib/utils/cn";

type CombatAchievementsProps = {
  combatAchievements: CombatAchievementsType;
};

export const CombatAchievements: React.FC<CombatAchievementsProps> = ({
  combatAchievements,
}) => {
  return (
    <Card
      iconPath="/assets/icons/combat-achievements.png"
      className="w-[260px]"
    >
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-1 p-1 shadow">
        {combatAchievements.map((tier) => {
          const percentageCompleted = Math.floor(
            (tier.tasksCompleted / tier.tasksTotal) * 100
          );

          let tierColor = "text-osrs-yellow";

          if (percentageCompleted == 0) {
            tierColor = "text-osrs-gray";
          } else if (percentageCompleted == 100) {
            tierColor = "text-osrs-green";
          }

          return (
            <div
              key={tier.tier}
              className="runescape-corners-border flex flex-col items-center justify-center bg-white bg-opacity-[0.02] font-runescape"
            >
              <p className="solid-text-shadow text-lg leading-none text-osrs-orange">
                {capitalize(tier.tier)}
              </p>
              <div className="relative my-[1px]">
                <Image
                  src={`/assets/combat-achievement-icons/${tier.tier.toLowerCase()}.png`}
                  alt={tier.tier}
                  quality={100}
                  width={38}
                  height={38}
                  className="drop-shadow-xl"
                />
              </div>
              <p
                className={cn(
                  "solid-text-shadow text-sm leading-none",
                  tierColor
                )}
              >
                {tier.tasksCompleted}/{tier.tasksTotal}
              </p>
              <div className="relative z-20 h-[10px] w-full rounded-sm border-2 border-black shadow">
                {/* Segment Lines */}
                <div className="absolute left-1/4 z-20 h-full border-l-2 border-black" />
                <div className="absolute left-1/2 z-20 h-full border-l-2 border-black" />
                <div className="absolute left-3/4 z-20 h-full border-l-2 border-black" />
                {/* Progress bar */}
                <div
                  className={cn(
                    "z-10 h-full",
                    percentageCompleted == 100
                      ? "bg-osrs-green"
                      : "bg-osrs-yellow"
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
};
