import { cn } from "~/lib/utils/cn";
import { Card } from "../../../components/Card";
import { type AchievementDiaries as AchievementDiariesType } from "~/lib/domain/profile-data-types";

type AchievementDiariesProps = {
  achievementDiaries: AchievementDiariesType;
};

export const AchievementDiaries: React.FC<AchievementDiariesProps> = ({
  achievementDiaries,
}) => {
  return (
    <Card
      iconPath="/assets/icons/achievement-diaries.png"
      className="w-[260px]"
    >
      <div className="text-yellow-osrs flex h-full flex-col space-y-[2px] overflow-y-scroll border-2 border-osrs-dark-border p-1 font-runescape text-lg leading-tight">
        {achievementDiaries.map((achievementDiary) => {
          const area = achievementDiary.area;
          const tiers = achievementDiary.tiers;

          const tasksCompleted = tiers.reduce(
            (count, tier) => count + tier.tasksCompleted,
            0
          );

          const tasksTotal = tiers.reduce(
            (count, tier) => count + tier.tasksTotal,
            0
          );

          let areaProgressClass = "text-osrs-yellow";

          const notStarted = tiers.every((tier) => tier.tasksCompleted == 0);

          if (notStarted) areaProgressClass = "text-osrs-red";

          const isCompleted = tiers.every(
            (tier) => tier.tasksCompleted == tier.tasksTotal
          );

          if (isCompleted) areaProgressClass = "text-osrs-green";

          return (
            <div
              key={area}
              className="rounded-sm border-2 border-osrs-dark-border p-[2px]"
            >
              <div
                className={cn(
                  "solid-text-shadow flex justify-between",
                  areaProgressClass
                )}
              >
                <p>{area}</p>
                <p className="text-base">
                  {tasksCompleted}/{tasksTotal}
                </p>
              </div>
              <div className="flex shadow">
                {tiers.map((tier) => {
                  const percentageCompleted = Math.floor(
                    (tier.tasksCompleted / tier.tasksTotal) * 100
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
                      className="h-[10px] w-1/4 rounded-sm border-2 border-r-0 border-black last:border-r-2"
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
      </div>
    </Card>
  );
};
