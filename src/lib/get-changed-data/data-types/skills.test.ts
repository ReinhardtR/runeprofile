import { expect, test, describe } from "vitest";
import {
  AccountSkillChange,
  SkillChange,
  getAccountSkillChanges,
  getSkillChanges,
} from "~/lib/get-changed-data/data-types/skills";

describe("getSkillChanges", () => {
  test("new skill added", () => {
    const result = getSkillChanges(
      [
        {
          name: "Attack",
          orderIdx: 0,
        },
        {
          name: "Strength",
          orderIdx: 1,
        },
      ],
      [
        {
          name: "Attack",
          orderIdx: 0,
        },
        {
          name: "Strength",
          orderIdx: 1,
        },
        {
          name: "Defence",
          orderIdx: 2,
        },
      ]
    );

    expect(result).toEqual<SkillChange[]>([
      {
        name: "Defence",
        orderIdx: 2,
      },
    ]);
  });

  test("skill order changed", () => {
    const result = getSkillChanges(
      [
        {
          name: "Attack",
          orderIdx: 0,
        },
        {
          name: "Strength",
          orderIdx: 1,
        },
        {
          name: "Defence",
          orderIdx: 2,
        },
      ],
      [
        {
          name: "Attack",
          orderIdx: 0,
        },
        {
          name: "Defence",
          orderIdx: 1,
        },
        {
          name: "Strength",
          orderIdx: 2,
        },
      ]
    );

    expect(result).toEqual<SkillChange[]>([
      {
        name: "Defence",
        orderIdx: 1,
      },
      {
        name: "Strength",
        orderIdx: 2,
      },
    ]);
  });
});

describe("getAccountSkillChanges", () => {
  test("new skill tracked", () => {
    const result = getAccountSkillChanges(
      [
        {
          name: "Attack",
          xp: 100,
        },
        {
          name: "Strength",
          xp: 200,
        },
      ],
      [
        {
          name: "Attack",
          xp: 100,
        },
        {
          name: "Strength",
          xp: 200,
        },
        {
          name: "Defence",
          xp: 300,
        },
      ]
    );

    expect(result).toEqual<AccountSkillChange[]>([
      {
        name: "Defence",
        xp: 300,
      },
    ]);
  });

  test("skill xp changed", () => {
    const result = getAccountSkillChanges(
      [
        {
          name: "Attack",
          xp: 100,
        },
        {
          name: "Strength",
          xp: 200,
        },
        {
          name: "Defence",
          xp: 300,
        },
      ],
      [
        {
          name: "Attack",
          xp: 100,
        },
        {
          name: "Strength",
          xp: 200,
        },
        {
          name: "Defence",
          xp: 400,
        },
      ]
    );

    expect(result).toEqual<AccountSkillChange[]>([
      {
        name: "Defence",
        xp: 400,
      },
    ]);
  });
});
