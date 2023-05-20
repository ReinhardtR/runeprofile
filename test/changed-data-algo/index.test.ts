import {
  changedAccountData,
  newAccountData,
  oldAccountData,
} from "test/changed-data-algo/data";
import { expect, it } from "vitest";
import { getChangedData } from "~/lib/changed-data-algo";

// input: new data in plugin-format
// input: old data in app-format
// output: changed data in app-format

it("should only return the data that has changed", () => {
  const changedData = getChangedData({
    oldData: oldAccountData,
    newData: newAccountData,
  });

  expect(changedData).toEqual(changedAccountData);
});
