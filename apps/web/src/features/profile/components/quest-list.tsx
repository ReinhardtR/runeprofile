import {
  QUESTS,
  QuestState,
  QuestType,
  getQuestStateFromIndex,
} from "@runeprofile/runescape";

import { Profile } from "~/core/api";
import { RuneScapeScrollArea } from "~/features/profile/components/scroll-area";
import { cn } from "~/shared/utils";

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
    const state = getQuestStateFromIndex(questData?.state);
    quests.push({
      name: quest.name,
      type: quest.type,
      points: quest.points,
      state,
    });
  }

  const completedQuests = quests.filter((q) => q.state === QuestState.FINISHED);
  const completedCount = completedQuests.length;
  const questsCount = quests.length;
  const points = completedQuests.reduce((acc, q) => acc + q.points, 0);

  const free = quests.filter((q) => q.type === QuestType.FREE);
  const members = quests.filter((q) => q.type === QuestType.MEMBERS);
  const mini = quests.filter((q) => q.type === QuestType.MINI);

  return (
    <div className="flex flex-col p-2 font-runescape solid-text-shadow max-h-full">
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
      <RuneScapeScrollArea
        className="border-2 border-osrs-dark-border rounded-xs"
        contentClassName="p-1.5 flex flex-col gap-y-4"
      >
        <QuestsSection sectionName="Free Quests" quests={free} />
        <QuestsSection sectionName="Members' Quests" quests={members} />
        <QuestsSection sectionName="Miniquests" quests={mini} />
      </RuneScapeScrollArea>
    </div>
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
    <div className="flex flex-col gap-y-[7px]">
      <p className="text-[21px] leading-4 font-bold text-osrs-orange mb-0.5">
        {sectionName}
      </p>
      {quests.map(({ name, state }) => {
        let progressColor = "text-osrs-yellow";

        if (state == QuestState.FINISHED) {
          progressColor = "text-osrs-green";
        } else if (state == QuestState.NOT_STARTED) {
          progressColor = "text-osrs-red";
        }

        return (
          <p key={name} className={cn("text-lg leading-4", progressColor)}>
            {name}
          </p>
        );
      })}
    </div>
  );
};
