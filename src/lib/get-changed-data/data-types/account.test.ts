import { describe, expect, test } from "vitest";

import { AccountType } from "~/lib/domain/profile-data-types";
import {
  AccountChange,
  getAccountChange,
} from "~/lib/get-changed-data/data-types/account";

describe("getAccountChange", () => {
  test("account type change", () => {
    const result = getAccountChange(
      {
        username: "TestUsername",
        accountType: AccountType.IRONMAN,
      },
      {
        username: "TestUsername",
        accountType: AccountType.HARDCORE_IRONMAN,
      }
    );

    expect(result).toEqual<AccountChange>({
      username: "TestUsername",
      accountType: AccountType.HARDCORE_IRONMAN,
    });
  });

  test("username change", () => {
    const result = getAccountChange(
      {
        username: "OldUsername",
        accountType: AccountType.IRONMAN,
      },
      {
        username: "NewUsername",
        accountType: AccountType.IRONMAN,
      }
    );

    expect(result).toEqual({
      username: "NewUsername",
      accountType: AccountType.IRONMAN,
    });
  });

  test("no changes", () => {
    const result = getAccountChange(
      {
        username: "TestUser",
        accountType: AccountType.IRONMAN,
      },
      {
        username: "TestUser",
        accountType: AccountType.IRONMAN,
      }
    );

    expect(result).toBeUndefined();
  });
});
