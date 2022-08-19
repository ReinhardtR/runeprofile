import clsx from "clsx";
import { Card } from "../Card";
import { AccountQueryResult } from "@/utils/accountQuery";

type QuestListProps = {
  questList: AccountQueryResult["quest_list"];
};

export const QuestList: React.FC<QuestListProps> = ({ questList }) => {
  return (
    <Card className="text-shadow flex w-[250px] flex-col p-4 font-runescape">
      <p className="text-xl text-osrs-orange">
        Quest Points: {questList.points}
      </p>
      <div className="flex-1 overflow-y-scroll rounded-sm border-2 border-osrs-border p-1.5">
        {questList.quests.map(({ name, state }) => {
          let progressColor = "text-osrs-yellow";

          if (state == "FINISHED") {
            progressColor = "text-osrs-green";
          } else if (state == "NOT_STARTED") {
            progressColor = "text-osrs-red";
          }

          return (
            <p key={state} className={clsx(progressColor)}>
              {name}
            </p>
          );
        })}
      </div>
    </Card>
  );
};
