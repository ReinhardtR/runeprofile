import { AccountType } from "~/lib/domain/profile-data-types";

export type AccountChange = {
  username: string;
  accountType: AccountType;
};

export type GetAccountChangeInputData = {
  username: string;
  accountType: AccountType;
};

export function getAccountChange(
  oldData: GetAccountChangeInputData | undefined,
  newData: GetAccountChangeInputData
): AccountChange | undefined {
  if (
    !oldData ||
    newData.username !== oldData.username ||
    newData.accountType !== oldData.accountType
  ) {
    return {
      username: newData.username,
      accountType: newData.accountType,
    };
  }

  return undefined;
}
