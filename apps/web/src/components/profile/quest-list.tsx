import {
  QUESTS,
  QUEST_STATES,
  QuestState,
  QuestType,
} from "@runeprofile/runescape";

import QuestIcon from "~/assets/icons/quest.png";
import RuneScapeScrollContainer from "~/components/profile/runescape-scroll-container";
import { Profile } from "~/lib/api";
import { cn } from "~/lib/utils";

import { Card } from "../card";

type MergedQuestData = {
  name: string;
  state: QuestState;
  type: QuestType;
  points: number;
};

export function QuestList({ data }: { data: Profile["quests"] }) {
  const quests: Array<MergedQuestData> = [];

  for (const quest of QUESTS) {
    const questData = data.find((q) => q.id === quest.id);
    const state = questData?.state
      ? QUEST_STATES[questData.state]
      : "NOT_STARTED";
    quests.push({
      name: quest.name,
      state: state ?? "NOT_STARTED",
      type: quest.type,
      points: quest.points,
    });
  }

  const completedQuests = quests.filter((q) => q.state === "FINISHED");
  const completedCount = completedQuests.length;
  const questsCount = quests.length;
  const points = completedQuests.reduce((acc, q) => acc + q.points, 0);

  const free = quests.filter((q) => q.type === "FREE");
  const members = quests.filter((q) => q.type === "MEMBERS");
  const mini = quests.filter((q) => q.type === "MINI");

  return (
    <Card
      icon={QuestIcon}
      className="flex flex-col p-4 font-runescape solid-text-shadow shrink-0"
    >
      <div
        className={cn(
          "flex items-center justify-between text-xl",
          completedCount == questsCount
            ? "text-osrs-green"
            : "text-osrs-orange",
        )}
      >
        <p>Quest Points: {points}</p>
        <p>
          {completedCount}/{questsCount}
        </p>
      </div>
      <RuneScapeScrollContainer
        className="border-2 border-osrs-dark-border rounded-xs"
        contentClassName="p-1.5"
      >
        <QuestsSection sectionName="Free Quests" quests={free} />
        <QuestsSection sectionName="Members' Quests" quests={members} />
        <QuestsSection sectionName="Miniquests" quests={mini} />
      </RuneScapeScrollContainer>
    </Card>
  );
}

type QuestSectionProps = {
  sectionName: string;
  quests: MergedQuestData[];
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
      <p className="h-[28px] text-[19px] font-bold text-osrs-orange">
        {sectionName}
      </p>
      {quests.map(({ name, state }) => {
        let progressColor = "text-osrs-yellow";

        if (state == "FINISHED") {
          progressColor = "text-osrs-green";
        } else if (state == "NOT_STARTED") {
          progressColor = "text-osrs-red";
        }

        return (
          <p key={name} className={cn("h-[25px] text-[17px]", progressColor)}>
            {name}
          </p>
        );
      })}
    </div>
  );
};
