import clsx from "clsx";
import { Card } from "../Card";
import { twMerge } from "tailwind-merge";

const questData = {
  points: 249,
  quests: {
    "Dragon Slayer": "COMPLETED",
    "Dragon Slayer II": "IN PROGRESS",
    "Dragon Slayer III": "NOT STARTED",
    "Dragon Slayer IV": "NOT STARTED",
    "Dragon Slayer V": "NOT STARTED",
    "Dragon Slayer VI": "NOT STARTED",
    "Dragon Slayer VII": "NOT STARTED",
    "Dragon Slayer VIII": "NOT STARTED",
    "Dragon Slayer IX": "NOT STARTED",
    "Dragon Slayer X": "NOT STARTED",
    "Dragon Slayer XI": "NOT STARTED",
    "Dragon Slayer XII": "NOT STARTED",
    "Dragon Slayer XIII": "NOT STARTED",
    "Dragon Slayer XIV": "NOT STARTED",
    "Dragon Slayer XV": "NOT STARTED",
    "Dragon Slayer XVI": "NOT STARTED",
    "Dragon Slayer XVII": "NOT STARTED",
    "Dragon Slayer XVIII": "NOT STARTED",
    "Dragon Slayer XIX": "NOT STARTED",
    "Dragon Slayer XX": "NOT STARTED",
    "Dragon Slayer XXI": "NOT STARTED",
    "Dragon Slayer XXII": "NOT STARTED",
    "Dragon Slayer XXIII": "NOT STARTED",
    "Dragon Slayer XXIV": "NOT STARTED",
    "Dragon Slayer XXV": "NOT STARTED",
    "Dragon Slayer XXVI": "NOT STARTED",
    "Dragon Slayer XXVII": "NOT STARTED",
    "Dragon Slayer XXVIII": "NOT STARTED",
    "Dragon Slayer XXIX": "NOT STARTED",
  },
};

export const QuestList = () => {
  return (
    <Card className="text-shadow flex w-[250px] flex-col p-4 font-runescape">
      <p className="text-xl text-osrs-orange">
        Quest Points: {questData.points}
      </p>
      <div className="flex-1 overflow-y-scroll rounded-sm border-2 border-osrs-border p-1.5">
        {Object.entries(questData.quests).map(([questName, questStatus]) => {
          let progressColor = "text-osrs-yellow";

          if (questStatus == "COMPLETED") {
            progressColor = "text-osrs-green";
          } else if (questStatus == "NOT STARTED") {
            progressColor = "text-osrs-red";
          }

          return (
            <p key={questName} className={clsx(progressColor)}>
              {questName}
            </p>
          );
        })}
      </div>
    </Card>
  );
};
