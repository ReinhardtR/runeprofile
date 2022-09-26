import clsx from "clsx";
import { Card } from "../Card";
import { AccountQueryResult } from "@/lib/account-query";

type QuestListProps = {
  questList: AccountQueryResult["quest_list"];
};

export const QuestList: React.FC<QuestListProps> = ({ questList }) => {
  const completedQuests = Object.values(questList.quests).reduce(
    (acc, curr) => {
      curr.forEach((quest) => {
        if (quest.state == "FINISHED") {
          acc++;
        }
      });

      return acc;
    },
    0
  );

  const totalQuests = Object.values(questList.quests).reduce((acc, curr) => {
    acc += curr.length;
    return acc;
  }, 0);

  return (
    <Card
      iconPath="/assets/icons/quest-list.png"
      className="text-shadow flex w-[250px] flex-col p-4 font-runescape"
    >
      <div
        className={clsx(
          "flex justify-between items-center text-xl",
          completedQuests == totalQuests
            ? "text-osrs-green"
            : "text-osrs-orange"
        )}
      >
        <p>Quest Points: {questList.points}</p>
        <p>
          {completedQuests}/{totalQuests}
        </p>
      </div>
      <div className="overflow-y-scroll flex-1 rounded-sm border-2 border-osrs-border p-1.5">
        {questList.quests.unknown.length > 0 && (
          <QuestsSection
            sectionName="New Quests"
            quests={questList.quests.unknown}
          />
        )}
        <QuestsSection
          sectionName="Free Quests"
          quests={questList.quests.f2p}
        />
        <QuestsSection
          sectionName="Members' Quests"
          quests={questList.quests.p2p}
        />
        <QuestsSection
          sectionName="Miniquests"
          quests={questList.quests.mini}
        />
      </div>
    </Card>
  );
};

type QuestSectionProps = {
  sectionName: string;
  quests: AccountQueryResult["quest_list"]["quests"]["f2p"];
};

export const QuestsSection: React.FC<QuestSectionProps> = ({
  sectionName,
  quests,
}) => {
  return (
    <div>
      <p className="text-[19px] text-osrs-orange font-bold">{sectionName}</p>
      {quests.map(({ name, state }) => {
        let progressColor = "text-osrs-yellow";

        if (state == "FINISHED") {
          progressColor = "text-osrs-green";
        } else if (state == "NOT_STARTED") {
          progressColor = "text-osrs-red";
        }

        return (
          <p key={name} className={clsx("text-[17px]", progressColor)}>
            {name}
          </p>
        );
      })}
    </div>
  );
};
