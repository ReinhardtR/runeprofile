import { HiscoresGameMode } from "~/lib/domain/profile-data-types";

export type HiscoresActivityChange = {
  gameMode: HiscoresGameMode;
  orderIdx: number;
  name: string;
};

export type GetHiscoresActivityChangesInputData = {
  gameMode: HiscoresGameMode;
  orderIdx: number;
  name: string;
}[];

export function getHiscoresActivityChanges(
  oldData: GetHiscoresActivityChangesInputData | undefined,
  newData: GetHiscoresActivityChangesInputData
): HiscoresActivityChange[] {
  const changes: HiscoresActivityChange[] = [];

  for (const newActivity of newData) {
    const oldActivity = oldData?.find(
      (a) => a.gameMode === newActivity.gameMode && a.name === newActivity.name
    );

    if (
      !oldActivity || //
      oldActivity.orderIdx !== newActivity.orderIdx
    ) {
      changes.push({
        gameMode: newActivity.gameMode,
        orderIdx: newActivity.orderIdx,
        name: newActivity.name,
      });
      continue;
    }
  }

  return changes;
}

export type AccountHiscoresActivityChange = {
  gameMode: HiscoresGameMode;
  name: string;
  rank: number;
  score: number;
};

export type GetAccountHiscoresActivityChangesInputDataOld = {
  gameMode: HiscoresGameMode;
  name: string;
  rank: number;
  score: number;
}[];

export type GetAccountHiscoresActivityChangesInputDataNew =
  GetAccountHiscoresActivityChangesInputDataOld;

export function getAccountHiscoresActivityChanges(
  oldData: GetAccountHiscoresActivityChangesInputDataOld | undefined,
  newData: GetAccountHiscoresActivityChangesInputDataNew
): AccountHiscoresActivityChange[] {
  const changes: AccountHiscoresActivityChange[] = [];

  for (const newActivity of newData) {
    const oldActivity = oldData?.find(
      (a) => a.gameMode === newActivity.gameMode && a.name === newActivity.name
    );

    if (
      !oldActivity || //
      oldActivity.rank !== newActivity.rank ||
      oldActivity.score !== newActivity.score
    ) {
      changes.push({
        gameMode: newActivity.gameMode,
        name: newActivity.name,
        rank: newActivity.rank,
        score: newActivity.score,
      });
      continue;
    }
  }

  return changes;
}
