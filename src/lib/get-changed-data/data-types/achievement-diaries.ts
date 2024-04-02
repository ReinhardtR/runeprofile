import { AchievementDiaryTierName } from "~/lib/domain/profile-data-types";

export type AchievementDiaryTierChange = {
  area: string;
  tier: AchievementDiaryTierName;
  tasksTotal: number;
};

export type GetAchievementDiaryChangesInputData = {
  area: string;
  tiers: {
    name: AchievementDiaryTierName;
    tasksTotal: number;
  }[];
}[];

export function getAchievementDiaryTierChanges(
  oldData: GetAchievementDiaryChangesInputData | undefined,
  newData: GetAchievementDiaryChangesInputData
): AchievementDiaryTierChange[] {
  const changes: AchievementDiaryTierChange[] = [];

  for (const newArea of newData) {
    const oldArea = oldData?.find((a) => a.area === newArea.area);

    if (!oldArea) {
      for (const newTier of newArea.tiers) {
        changes.push({
          area: newArea.area,
          tier: newTier.name,
          tasksTotal: newTier.tasksTotal,
        });
      }
      continue;
    }

    for (const newTier of newArea.tiers) {
      const oldTier = oldArea.tiers.find((t) => t.name === newTier.name);

      if (
        !oldTier || //
        oldTier.tasksTotal !== newTier.tasksTotal
      ) {
        changes.push({
          area: newArea.area,
          tier: newTier.name,
          tasksTotal: newTier.tasksTotal,
        });
      }
    }
  }

  return changes;
}

export type AccountAchievementDiaryTierChange = {
  area: string;
  tier: AchievementDiaryTierName;
  tasksCompleted: number;
};

export type GetAccountAchievementDiaryTierChangesInputData = {
  area: string;
  tiers: {
    name: AchievementDiaryTierName;
    tasksCompleted: number;
  }[];
}[];

export function getAccountAchievementDiaryTierChanges(
  oldData: GetAccountAchievementDiaryTierChangesInputData | undefined,
  newData: GetAccountAchievementDiaryTierChangesInputData
): AccountAchievementDiaryTierChange[] {
  const changes: AccountAchievementDiaryTierChange[] = [];

  for (const newArea of newData) {
    const oldArea = oldData?.find((a) => a.area === newArea.area);

    if (!oldArea) {
      for (const newTier of newArea.tiers) {
        changes.push({
          area: newArea.area,
          tier: newTier.name,
          tasksCompleted: newTier.tasksCompleted,
        });
      }
      continue;
    }

    for (const newTier of newArea.tiers) {
      const oldTier = oldArea.tiers.find((t) => t.name === newTier.name);

      if (
        !oldTier || //
        oldTier.tasksCompleted !== newTier.tasksCompleted
      ) {
        changes.push({
          area: newArea.area,
          tier: newTier.name,
          tasksCompleted: newTier.tasksCompleted,
        });
      }
    }
  }

  return changes;
}
