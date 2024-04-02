import { type QuestState, type QuestType } from "~/lib/constants/quests";

export type QuestChange = {
  name: string;
  type: QuestType;
  orderIdx: number;
};

export type GetQuestChangesInputData = {
  name: string;
  type: QuestType;
  orderIdx: number;
}[];

export function getQuestChanges(
  oldData: GetQuestChangesInputData | undefined,
  newData: GetQuestChangesInputData
): QuestChange[] {
  const changes: QuestChange[] = [];

  for (const newQuest of newData) {
    const oldQuest = oldData?.find((q) => q.name === newQuest.name);

    if (
      !oldQuest || //
      oldQuest.type !== newQuest.type ||
      oldQuest.orderIdx !== newQuest.orderIdx
    ) {
      changes.push({
        name: newQuest.name,
        type: newQuest.type,
        orderIdx: newQuest.orderIdx,
      });
      continue;
    }
  }

  return changes;
}

export type AccountQuestChange = {
  name: string;
  state: QuestState;
};

export type GetAccountQuestChangesInputData = {
  name: string;
  state: QuestState;
}[];

export function getAccountQuestChanges(
  oldData: GetAccountQuestChangesInputData | undefined,
  newData: GetAccountQuestChangesInputData
): AccountQuestChange[] {
  const changes: AccountQuestChange[] = [];

  for (const newQuest of newData) {
    const oldQuest = oldData?.find((q) => q.name === newQuest.name);

    if (
      !oldQuest || //
      oldQuest.state !== newQuest.state
    ) {
      changes.push({
        name: newQuest.name,
        state: newQuest.state,
      });
      continue;
    }
  }

  return changes;
}

export type AccountQuestListChange = {
  points: number;
};

export type GetAccountQuestListChangesInputData = {
  points: number;
};

export function getAccountQuestListChange(
  oldData: GetAccountQuestListChangesInputData | undefined,
  newData: GetAccountQuestListChangesInputData
): AccountQuestListChange | undefined {
  if (oldData?.points !== newData.points) {
    return {
      points: newData.points,
    };
  }
}
