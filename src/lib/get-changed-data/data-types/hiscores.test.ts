import { describe, test, expect } from "vitest";
import { HiscoresGameMode } from "~/lib/domain/profile-data-types";

import {
  getHiscoresActivityChanges,
  HiscoresActivityChange,
  getAccountHiscoresActivityChanges,
  AccountHiscoresActivityChange,
} from "~/lib/get-changed-data/data-types/hiscores";

describe("getHiscoresActivityChanges", () => {
  test("new activity added", () => {
    const result = getHiscoresActivityChanges(
      [
        { gameMode: HiscoresGameMode.IRONMAN, orderIdx: 0, name: "A" },
        { gameMode: HiscoresGameMode.HARDCORE, orderIdx: 1, name: "B" },
      ],
      [
        { gameMode: HiscoresGameMode.IRONMAN, orderIdx: 0, name: "A" },
        { gameMode: HiscoresGameMode.HARDCORE, orderIdx: 1, name: "B" },
        { gameMode: HiscoresGameMode.ULTIMATE, orderIdx: 2, name: "C" },
      ]
    );

    expect(result).toEqual<HiscoresActivityChange[]>([
      { gameMode: HiscoresGameMode.ULTIMATE, orderIdx: 2, name: "C" },
    ]);
  });

  test("activity order changed", () => {
    const result = getHiscoresActivityChanges(
      [
        { gameMode: HiscoresGameMode.NORMAL, orderIdx: 0, name: "A" },
        { gameMode: HiscoresGameMode.IRONMAN, orderIdx: 1, name: "B" },
      ],
      [
        { gameMode: HiscoresGameMode.IRONMAN, orderIdx: 0, name: "B" },
        { gameMode: HiscoresGameMode.NORMAL, orderIdx: 1, name: "A" },
      ]
    );

    expect(result).toEqual<HiscoresActivityChange[]>([
      { gameMode: HiscoresGameMode.IRONMAN, orderIdx: 0, name: "B" },
      { gameMode: HiscoresGameMode.NORMAL, orderIdx: 1, name: "A" },
    ]);
  });

  test("no changes", () => {
    const result = getHiscoresActivityChanges(
      [
        { gameMode: HiscoresGameMode.IRONMAN, orderIdx: 0, name: "A" },
        { gameMode: HiscoresGameMode.HARDCORE, orderIdx: 1, name: "B" },
      ],
      [
        { gameMode: HiscoresGameMode.IRONMAN, orderIdx: 0, name: "A" },
        { gameMode: HiscoresGameMode.HARDCORE, orderIdx: 1, name: "B" },
      ]
    );

    expect(result).toEqual<HiscoresActivityChange[]>([]);
  });
});

describe("getAccountHiscoresActivityChanges", () => {
  test("activity score changed", () => {
    const result = getAccountHiscoresActivityChanges(
      [
        {
          gameMode: HiscoresGameMode.NORMAL,
          name: "A",
          rank: 1,
          score: 100,
        },
        {
          gameMode: HiscoresGameMode.IRONMAN,
          name: "B",
          rank: 2,
          score: 200,
        },
      ],
      [
        {
          gameMode: HiscoresGameMode.NORMAL,
          name: "A",
          rank: 1,
          score: 200,
        },
        {
          gameMode: HiscoresGameMode.IRONMAN,
          name: "B",
          rank: 2,
          score: 200,
        },
      ]
    );

    expect(result).toEqual<AccountHiscoresActivityChange[]>([
      {
        gameMode: HiscoresGameMode.NORMAL,
        name: "A",
        rank: 1,
        score: 200,
      },
    ]);
  });

  test("activity rank changed", () => {
    const result = getAccountHiscoresActivityChanges(
      [
        {
          gameMode: HiscoresGameMode.NORMAL,
          name: "A",
          rank: 1,
          score: 100,
        },
        {
          gameMode: HiscoresGameMode.IRONMAN,
          name: "B",
          rank: 2,
          score: 200,
        },
      ],
      [
        {
          gameMode: HiscoresGameMode.NORMAL,
          name: "A",
          rank: 2,
          score: 100,
        },
        {
          gameMode: HiscoresGameMode.IRONMAN,
          name: "B",
          rank: 2,
          score: 200,
        },
      ]
    );

    expect(result).toEqual<AccountHiscoresActivityChange[]>([
      {
        gameMode: HiscoresGameMode.NORMAL,
        name: "A",
        rank: 2,
        score: 100,
      },
    ]);
  });

  test("new activity tracked", () => {
    const result = getAccountHiscoresActivityChanges(
      [
        {
          gameMode: HiscoresGameMode.NORMAL,
          name: "A",
          rank: 1,
          score: 100,
        },
        {
          gameMode: HiscoresGameMode.IRONMAN,
          name: "B",
          rank: 2,
          score: 200,
        },
      ],
      [
        {
          gameMode: HiscoresGameMode.NORMAL,
          name: "A",
          rank: 1,
          score: 100,
        },
        {
          gameMode: HiscoresGameMode.IRONMAN,
          name: "B",
          rank: 2,
          score: 200,
        },
        {
          gameMode: HiscoresGameMode.ULTIMATE,
          name: "C",
          rank: 3,
          score: 300,
        },
      ]
    );

    expect(result).toEqual<AccountHiscoresActivityChange[]>([
      {
        gameMode: HiscoresGameMode.ULTIMATE,
        name: "C",
        rank: 3,
        score: 300,
      },
    ]);
  });

  test("no changes", () => {
    const result = getAccountHiscoresActivityChanges(
      [
        {
          gameMode: HiscoresGameMode.NORMAL,
          name: "A",
          rank: 1,
          score: 100,
        },
        {
          gameMode: HiscoresGameMode.IRONMAN,
          name: "B",
          rank: 2,
          score: 200,
        },
      ],
      [
        {
          gameMode: HiscoresGameMode.NORMAL,
          name: "A",
          rank: 1,
          score: 100,
        },
        {
          gameMode: HiscoresGameMode.IRONMAN,
          name: "B",
          rank: 2,
          score: 200,
        },
      ]
    );

    expect(result).toEqual([]);
  });
});
