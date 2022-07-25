import clsx from "clsx";
import Image from "next/future/image";
import { Card } from "../Card";

const combatAchievements = {
  Easy: {
    completed: 33,
    total: 33,
  },
  Medium: {
    completed: 38,
    total: 41,
  },
  Hard: {
    completed: 30,
    total: 60,
  },
  Elite: {
    completed: 18,
    total: 108,
  },
  Master: {
    completed: 8,
    total: 91,
  },
  Grandmaster: {
    completed: 0,
    total: 69,
  },
};

export const CombatAchievements = () => {
  return (
    <Card className="w-[250px]">
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-1 p-1 shadow">
        {Object.entries(combatAchievements).map(([tierName, tierData]) => {
          const percentageCompleted = Math.floor(
            (tierData.completed / tierData.total) * 100
          );

          let tierColor = "text-osrs-yellow";

          if (percentageCompleted == 0) {
            tierColor = "text-osrs-gray";
          } else if (percentageCompleted == 100) {
            tierColor = "text-osrs-green";
          }

          return (
            <div
              key={tierName}
              className="runescape-combat-achievement-tier flex flex-col items-center justify-center bg-white bg-opacity-[0.02] font-runescape"
            >
              <p className="text-shadow text-lg leading-none text-osrs-orange">
                {tierName}
              </p>
              <Image
                src={`/assets/combat-achievement-icons/${tierName.toLowerCase()}.png`}
                quality={100}
                className="my-[1px] aspect-square w-[38px] drop-shadow-xl"
              />
              <p
                className={clsx("text-shadow text-sm leading-none", tierColor)}
              >
                {tierData.completed}/{tierData.total}
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
