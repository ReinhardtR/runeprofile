import { describe, expect, test } from "vitest";

import {
  AccountTypes,
  HARDCORE_MAIN_ACCOUNT_TYPE_ID,
  resolveAccountType,
} from "./account-types";
import { getHiscoreLeaderboardForAccountType } from "./hiscores";

describe("resolveAccountType", () => {
  test("normal account without the HC_MAIN varbit stays normal", () => {
    expect(resolveAccountType(0, 0)).toBe(0);
  });

  test("older plugins that don't report HC_MAIN keep the ironman varbit", () => {
    expect(resolveAccountType(0, undefined)).toBe(0);
    expect(resolveAccountType(3, undefined)).toBe(3);
  });

  test("HC_MAIN on a non-ironman is a Hardcore Main", () => {
    expect(resolveAccountType(0, 1)).toBe(HARDCORE_MAIN_ACCOUNT_TYPE_ID);
    expect(AccountTypes[HARDCORE_MAIN_ACCOUNT_TYPE_ID]).toMatchObject({
      key: "hardcore_main",
      name: "Hardcore Main",
    });
  });

  test("an ironman type wins over HC_MAIN", () => {
    expect(resolveAccountType(1, 1)).toBe(1);
  });
});

describe("getHiscoreLeaderboardForAccountType", () => {
  test("Hardcore Mains use their own hiscores", () => {
    expect(
      getHiscoreLeaderboardForAccountType(HARDCORE_MAIN_ACCOUNT_TYPE_ID),
    ).toBe("hardcore_main");
  });

  test("everything else uses the normal hiscores", () => {
    for (const type of AccountTypes) {
      if (type.id === HARDCORE_MAIN_ACCOUNT_TYPE_ID) continue;
      expect(getHiscoreLeaderboardForAccountType(type.id)).toBe("normal");
    }
  });
});
