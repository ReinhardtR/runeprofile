import { capitalize } from "@/utils/capitalize-string";
import clsx from "clsx";
import Image from "next/future/image";
import { Card } from "../Card";

type CombatAchievementTier = {
  tier: string;
  completed: number;
  total: number;
};

type CombatAchievementsProps = {
  combatAchievements: {
    tiers: CombatAchievementTier[];
  };
};

export const CombatAchievements: React.FC<CombatAchievementsProps> = ({
  combatAchievements,
}) => {
  return (
    <Card
      iconPath="/assets/icons/combat-achievements.png"
      className="w-[250px]"
    >
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-1 p-1 shadow">
        {combatAchievements.tiers.map((tier) => {
          const percentageCompleted = Math.floor(
            (tier.completed / tier.total) * 100
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
              <p className="text-shadow text-lg leading-none text-osrs-orange">
                {capitalize(tier.tier)}
              </p>
              <div className="relative w-[38px] my-[1px] aspect-square">
                <Image
                  src={`/assets/combat-achievement-icons/${tier.tier.toLowerCase()}.png`}
                  alt={tier.tier}
                  quality={100}
                  fill
                  className="drop-shadow-xl"
                />
              </div>
              <p
                className={clsx("text-shadow text-sm leading-none", tierColor)}
              >
                {tier.completed}/{tier.total}
              </p>
              <div className="relative z-20 h-[10px] w-full rounded-sm border-2 border-black shadow">
                {/* Segment Lines */}
                <div className="absolute left-1/4 z-20 h-full border-l-2 border-black" />
                <div className="absolute left-1/2 z-20 h-full border-l-2 border-black" />
                <div className="absolute left-3/4 z-20 h-full border-l-2 border-black" />
                {/* Progress bar */}
                <div
                  className={clsx(
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
