import { describe, expect, test } from "vitest";

import { QuestState, QuestType } from "~/lib/constants/quests";
import {
  AccountQuestChange,
  AccountQuestListChange,
  getAccountQuestChanges,
  getAccountQuestListChange,
  getQuestChanges,
  QuestChange,
} from "~/lib/get-changed-data/data-types/quests";

describe("getQuestChanges", () => {
  test("new quest added", () => {
    const result = getQuestChanges(
      [
        {
          name: "TestQuest1",
          type: QuestType.F2P,
          orderIdx: 0,
        },
      ],
      [
        {
          name: "TestQuest1",
          type: QuestType.F2P,
          orderIdx: 0,
        },
        {
          name: "TestQuest2",
          type: QuestType.F2P,
          orderIdx: 1,
        },
      ]
    );

    expect(result).toEqual<QuestChange[]>([
      {
        name: "TestQuest2",
        type: QuestType.F2P,
        orderIdx: 1,
      },
    ]);
  });

  test("quest order changed", () => {
    const result = getQuestChanges(
      [
        {
          name: "TestQuest1",
          type: QuestType.F2P,
          orderIdx: 0,
        },
        {
          name: "TestQuest2",
          type: QuestType.P2P,
          orderIdx: 1,
        },
        {
          name: "TestQuest3",
          type: QuestType.MINI,
          orderIdx: 2,
        },
      ],
      [
        {
          name: "TestQuest1",
          type: QuestType.F2P,
          orderIdx: 0,
        },
        {
          name: "TestQuest3",
          type: QuestType.P2P,
          orderIdx: 1,
        },
        {
          name: "TestQuest2",
          type: QuestType.MINI,
          orderIdx: 2,
        },
      ]
    );

    expect(result).toEqual<QuestChange[]>([
      {
        name: "TestQuest3",
        type: QuestType.P2P,
        orderIdx: 1,
      },
      {
        name: "TestQuest2",
        type: QuestType.MINI,
        orderIdx: 2,
      },
    ]);
  });

  test("quest type changed", () => {
    const result = getQuestChanges(
      [
        {
          name: "TestQuest1",
          type: QuestType.F2P,
          orderIdx: 0,
        },
        {
          name: "TestQuest2",
          type: QuestType.P2P,
          orderIdx: 1,
        },
      ],
      [
        {
          name: "TestQuest1",
          type: QuestType.F2P,
          orderIdx: 0,
        },
        {
          name: "TestQuest2",
          type: QuestType.F2P,
          orderIdx: 1,
        },
      ]
    );

    expect(result).toEqual<QuestChange[]>([
      {
        name: "TestQuest2",
        type: QuestType.F2P,
        orderIdx: 1,
      },
    ]);
  });

  test("no changes", () => {
    const result = getQuestChanges(
      [
        {
          name: "TestQuest1",
          type: QuestType.F2P,
          orderIdx: 0,
        },
        {
          name: "TestQuest2",
          type: QuestType.P2P,
          orderIdx: 1,
        },
      ],
      [
        {
          name: "TestQuest1",
          type: QuestType.F2P,
          orderIdx: 0,
        },
        {
          name: "TestQuest2",
          type: QuestType.P2P,
          orderIdx: 1,
        },
      ]
    );

    expect(result).toEqual<QuestChange[]>([]);
  });
});

describe("getAccountQuestChanges", () => {
  test("new quest tracked", () => {
    const result = getAccountQuestChanges(
      [
        {
          name: "TestQuest1",
          state: QuestState.FINISHED,
        },
      ],
      [
        {
          name: "TestQuest1",
          state: QuestState.FINISHED,
        },
        {
          name: "TestQuest2",
          state: QuestState.NOT_STARTED,
        },
      ]
    );

    expect(result).toEqual<AccountQuestChange[]>([
      {
        name: "TestQuest2",
        state: QuestState.NOT_STARTED,
      },
    ]);
  });

  test("quest state changed", () => {
    const result = getAccountQuestChanges(
      [
        {
          name: "TestQuest1",
          state: QuestState.NOT_STARTED,
        },
        {
          name: "TestQuest2",
          state: QuestState.IN_PROGRESS,
        },
      ],
      [
        {
          name: "TestQuest1",
          state: QuestState.NOT_STARTED,
        },
        {
          name: "TestQuest2",
          state: QuestState.FINISHED,
        },
      ]
    );

    expect(result).toEqual<AccountQuestChange[]>([
      {
        name: "TestQuest2",
        state: QuestState.FINISHED,
      },
    ]);
  });

  test("no changes", () => {
    const result = getAccountQuestChanges(
      [
        {
          name: "TestQuest1",
          state: QuestState.NOT_STARTED,
        },
        {
          name: "TestQuest2",
          state: QuestState.FINISHED,
        },
      ],
      [
        {
          name: "TestQuest1",
          state: QuestState.NOT_STARTED,
        },
        {
          name: "TestQuest2",
          state: QuestState.FINISHED,
        },
      ]
    );

    expect(result).toEqual<AccountQuestChange[]>([]);
  });
});

describe("getAccountQuestListChange", () => {
  test("quest points changed", () => {
    const result = getAccountQuestListChange(
      {
        points: 0,
      },
      {
        points: 1,
      }
    );

    expect(result).toEqual<AccountQuestListChange>({
      points: 1,
    });
  });

  test("no changes", () => {
    const result = getAccountQuestListChange(
      {
        points: 0,
      },
      {
        points: 0,
      }
    );

    expect(result).toBeUndefined();
  });
});
