import { QuestState, QuestType } from "~/lib/constants/quests";
import { Card } from "../../../components/Card";
import {
  type QuestList as QuestListType,
  type Quest,
} from "~/lib/domain/profile-data-types";
import { cn } from "~/lib/utils/cn";

type QuestListProps = {
  questList: QuestListType;
};

export const QuestList: React.FC<QuestListProps> = ({ questList }) => {
  const completedQuests = Object.values(questList.quests).reduce(
    (acc, quest) => {
      if (quest.state == QuestState.FINISHED) {
        acc++;
      }
      return acc;
    },
    0
  );

  const totalQuests = questList.quests.length;

  const quests = {
    [QuestType.UNKNOWN]: questList.quests.filter(
      (quest) => quest.type == QuestType.UNKNOWN
    ),
    [QuestType.F2P]: questList.quests.filter(
      (quest) => quest.type == QuestType.F2P
    ),
    [QuestType.P2P]: questList.quests.filter(
      (quest) => quest.type == QuestType.P2P
    ),
    [QuestType.MINI]: questList.quests.filter(
      (quest) => quest.type == QuestType.MINI
    ),
  };

  return (
    <Card
      iconPath="/assets/icons/quest-list.png"
      className="solid-text-shadow flex w-[260px] flex-col p-4 font-runescape"
    >
      <div
        className={cn(
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
      <div className="overflow-y-scroll flex-1 rounded-sm border-2 border-osrs-dark-border p-1.5">
        <QuestsSection sectionName="New Quests" quests={quests.UNKNOWN} />
        <QuestsSection sectionName="Free Quests" quests={quests.F2P} />
        <QuestsSection sectionName="Members' Quests" quests={quests.P2P} />
        <QuestsSection sectionName="Miniquests" quests={quests.MINI} />
      </div>
    </Card>
  );
};

type QuestSectionProps = {
  sectionName: string;
  quests: Quest[];
};

export const QuestsSection: React.FC<QuestSectionProps> = ({
  sectionName,
  quests,
}) => {
  if (quests.length === 0) {
    return null;
  }

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
          <p key={name} className={cn("text-[17px]", progressColor)}>
            {name}
          </p>
        );
      })}
    </div>
  );
};
