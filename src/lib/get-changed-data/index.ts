import {
  type ProfileFullWithHash,
  type HiscoresGameMode,
} from "~/lib/domain/profile-data-types";
import {
  AccountChange,
  getAccountChange,
} from "~/lib/get-changed-data/data-types/account";
import {
  getAccountAchievementDiaryTierChanges,
  type AccountAchievementDiaryTierChange,
  type AchievementDiaryTierChange,
  getAchievementDiaryTierChanges,
} from "~/lib/get-changed-data/data-types/achievement-diaries";
import {
  type AccountCollectionLogItemChange,
  type AccountCollectionLogPageKillCountChange,
  type CollectionLogItemChange,
  type CollectionLogPageChange,
  type CollectionLogPageItemChange,
  type CollectionLogPageKillCountChange,
  getAccountCollectionLogItemChanges,
  getAccountCollectionLogPageKillCountChanges,
  getCollectionLogPageChanges,
  getCollectionLogPageKillCountChanges,
  getCollectionLogPageItemChanges,
  getCollectionLogItemChanges,
  type GetAccountCollectionLogItemChangesInputDataNew,
  type GetAccountCollectionLogItemChangesInputDataOld,
  type GetAccountCollectionLogPageKillCountChangesInputDataOld,
  type GetAccountCollectionLogPageKillCountChangesInputDataNew,
  type GetCollectionLogPageKillCountChangesInputDataOld,
  type GetCollectionLogPageKillCountChangesInputDataNew,
  type GetCollectionLogPageItemChangesInputDataOld,
  type GetCollectionLogPageItemChangesInputDataNew,
} from "~/lib/get-changed-data/data-types/collection-log";
import {
  getAccountCombatAchievementTierChanges,
  type AccountCombatAchievementTierChange,
  type CombatAchievementTierChange,
  getCombatAchievementTierChanges,
} from "~/lib/get-changed-data/data-types/combat-achievements";
import {
  getAccountHiscoresActivityChanges,
  type AccountHiscoresActivityChange,
  type HiscoresActivityChange,
  getHiscoresActivityChanges,
  type GetAccountHiscoresActivityChangesInputDataOld,
  type GetAccountHiscoresActivityChangesInputDataNew,
} from "~/lib/get-changed-data/data-types/hiscores";
import {
  getQuestChanges,
  type AccountQuestChange,
  type AccountQuestListChange,
  type QuestChange,
  getAccountQuestListChange,
  getAccountQuestChanges,
} from "~/lib/get-changed-data/data-types/quests";
import {
  type SkillChange,
  type AccountSkillChange,
  getSkillChanges,
  getAccountSkillChanges,
} from "~/lib/get-changed-data/data-types/skills";
import { PluginData } from "~/lib/domain/plugin-data-schema";

export type ChangedDataResult = {
  account: {
    accountHash: string;

    account?: AccountChange;

    skills: AccountSkillChange[];

    questList?: AccountQuestListChange;
    quests: AccountQuestChange[];

    achievementDiaries: AccountAchievementDiaryTierChange[];

    combatAchievements: AccountCombatAchievementTierChange[];

    hiscoresActivities: AccountHiscoresActivityChange[];

    collectionLogItems: AccountCollectionLogItemChange[];
    collectionLogPageKillCounts: AccountCollectionLogPageKillCountChange[];
  };
  game: {
    skills: SkillChange[];

    quests: QuestChange[];

    achievementDiaries: AchievementDiaryTierChange[];

    combatAchievements: CombatAchievementTierChange[];

    hiscoresActivities: HiscoresActivityChange[];

    collectionLogPages: CollectionLogPageChange[];
    collectionLogPageKillCounts: CollectionLogPageKillCountChange[];
    collectionLogPageItems: CollectionLogPageItemChange[];
    collectionLogItems: CollectionLogItemChange[];
  };
};

const getAccountHiscoresActivityChangesInputDataOld = (
  data: ProfileFullWithHash
): GetAccountHiscoresActivityChangesInputDataOld => {
  const result: GetAccountHiscoresActivityChangesInputDataOld = [];
  for (const leaderboard of Object.values(data.hiscores)) {
    for (const entry of leaderboard.entries) {
      result.push({
        gameMode: leaderboard.gameMode,
        name: entry.activity,
        rank: entry.rank,
        score: entry.score,
      });
    }
  }
  return result;
};

const getAccountHiscoresActivityChangesInputDataNew = (
  data: PluginData
): GetAccountHiscoresActivityChangesInputDataNew => {
  const result: GetAccountHiscoresActivityChangesInputDataNew = [];
  for (const leaderboard of Object.values(data.hiscores)) {
    for (const entry of leaderboard.activities) {
      result.push({
        gameMode: leaderboard.gameMode,
        name: entry.name,
        rank: entry.rank,
        score: entry.score,
      });
    }
  }
  return result;
};

const getAccountCollectionLogItemChangesInputDataOld = (
  data: ProfileFullWithHash
): GetAccountCollectionLogItemChangesInputDataOld => {
  return data.collectionLog.items.map((item) => ({
    itemId: item.id,
    quantity: item.quantity,
    kcs: data.collectionLog.tabs
      .flatMap((t) => t.pages)
      .filter((p) => p.itemIds.includes(item.id))
      .flatMap((p) =>
        p.killCounts.map((kc) => ({
          label: kc.label,
          count: kc.count,
        }))
      ),
  }));
};

const getAccountCollectionLogItemChangesInputDataNew = (
  data: PluginData
): GetAccountCollectionLogItemChangesInputDataNew => {
  const result: GetAccountCollectionLogItemChangesInputDataNew = [];
  for (const tab of data.collectionLog.tabs) {
    for (const page of tab.pages) {
      for (const item of page.items) {
        result.push({
          itemId: item.id,
          quantity: item.quantity,
          kcs:
            page.killCounts?.map((kc) => ({
              label: kc.label,
              count: kc.count,
            })) ?? [],
        });
      }
    }
  }
  return result;
};

const getAccountCollectionLogPageKillCountChangesInputDataOld = (
  data: ProfileFullWithHash
): GetAccountCollectionLogPageKillCountChangesInputDataOld => {
  const result: GetAccountCollectionLogPageKillCountChangesInputDataOld = [];
  for (const tab of data.collectionLog.tabs) {
    for (const page of tab.pages) {
      for (const kc of page.killCounts) {
        result.push({
          label: kc.label,
          count: kc.count,
        });
      }
    }
  }
  return result;
};

const getAccountCollectionLogPageKillCountChangesInputDataNew = (
  data: PluginData
): GetAccountCollectionLogPageKillCountChangesInputDataNew => {
  const result: GetAccountCollectionLogPageKillCountChangesInputDataNew = [];
  for (const tab of data.collectionLog.tabs) {
    for (const page of tab.pages) {
      if (!page.killCounts) continue;
      for (const kc of page.killCounts) {
        result.push({
          label: kc.label,
          count: kc.count,
        });
      }
    }
  }
  return result;
};

const getCollectionLogPageKillCountChangesInputDataOld = (
  data: ProfileFullWithHash
): GetCollectionLogPageKillCountChangesInputDataOld => {
  const result: GetCollectionLogPageKillCountChangesInputDataOld = [];
  for (const tab of data.collectionLog.tabs) {
    for (const page of tab.pages) {
      for (const kc of page.killCounts) {
        result.push({
          pageName: page.name,
          label: kc.label,
          orderIdx: kc.orderIdx,
        });
      }
    }
  }
  return result;
};

const getCollectionLogPageKillCountChangesInputDataNew = (
  data: PluginData
): GetCollectionLogPageKillCountChangesInputDataNew => {
  const result: GetCollectionLogPageKillCountChangesInputDataNew = [];
  for (const tab of data.collectionLog.tabs) {
    for (const page of tab.pages) {
      if (!page.killCounts) continue;
      for (const kc of page.killCounts) {
        result.push({
          pageName: page.name,
          label: kc.label,
          orderIdx: kc.orderIdx,
        });
      }
    }
  }
  return result;
};

const getCollectionLogPageItemChangesInputDataOld = (
  data: ProfileFullWithHash
): GetCollectionLogPageItemChangesInputDataOld => {
  const result: GetCollectionLogPageItemChangesInputDataOld = [];
  for (const tab of data.collectionLog.tabs) {
    for (const page of tab.pages) {
      page.itemIds.forEach((itemId, orderIdx) => {
        result.push({
          itemId,
          orderIdx,
          pageName: page.name,
        });
      });
    }
  }
  return result;
};

const getCollectionLogPageItemChangesInputDataNew = (
  data: PluginData
): GetCollectionLogPageItemChangesInputDataNew => {
  const result: GetCollectionLogPageItemChangesInputDataNew = [];
  for (const tab of data.collectionLog.tabs) {
    for (const page of tab.pages) {
      page.items.forEach((item) => {
        result.push({
          itemId: item.id,
          orderIdx: item.orderIdx,
          pageName: page.name,
        });
      });
    }
  }
  return result;
};

export function getChangedData(
  oldData: ProfileFullWithHash | null,
  newData: PluginData
): ChangedDataResult {
  return {
    account: {
      accountHash: newData.accountHash,

      account: getAccountChange(
        oldData
          ? {
              username: oldData.username,
              accountType: oldData.accountType,
            }
          : undefined,
        {
          username: newData.username,
          accountType: newData.accountType,
        }
      ),

      skills: getAccountSkillChanges(oldData?.skills, newData.skills),

      quests: getAccountQuestChanges(
        oldData?.questList.quests,
        newData.questList.quests
      ),
      questList: getAccountQuestListChange(
        oldData?.questList,
        newData.questList
      ),

      achievementDiaries: getAccountAchievementDiaryTierChanges(
        oldData?.achievementDiaries,
        newData.achievementDiaries
      ),

      combatAchievements: getAccountCombatAchievementTierChanges(
        oldData?.combatAchievements,
        newData.combatAchievements
      ),

      hiscoresActivities: getAccountHiscoresActivityChanges(
        oldData
          ? getAccountHiscoresActivityChangesInputDataOld(oldData)
          : undefined,
        getAccountHiscoresActivityChangesInputDataNew(newData)
      ),

      collectionLogItems: getAccountCollectionLogItemChanges(
        oldData
          ? getAccountCollectionLogItemChangesInputDataOld(oldData)
          : undefined,
        getAccountCollectionLogItemChangesInputDataNew(newData)
      ),
      collectionLogPageKillCounts: getAccountCollectionLogPageKillCountChanges(
        oldData
          ? getAccountCollectionLogPageKillCountChangesInputDataOld(oldData)
          : undefined,
        getAccountCollectionLogPageKillCountChangesInputDataNew(newData)
      ),
    },
    game: {
      skills: getSkillChanges(oldData?.skills, newData.skills),

      quests: getQuestChanges(
        oldData?.questList.quests,
        newData.questList.quests
      ),

      achievementDiaries: getAchievementDiaryTierChanges(
        oldData?.achievementDiaries,
        newData.achievementDiaries
      ),

      combatAchievements: getCombatAchievementTierChanges(
        oldData?.combatAchievements,
        newData.combatAchievements
      ),

      hiscoresActivities: getHiscoresActivityChanges(
        oldData?.hiscores.flatMap((hs) =>
          hs.entries.map((e) => ({
            gameMode: hs.gameMode,
            name: e.activity,
            orderIdx: e.orderIdx,
          }))
        ),
        newData.hiscores.flatMap((hs) =>
          hs.activities.map((a) => ({
            gameMode: hs.gameMode,
            name: a.name,
            orderIdx: a.orderIdx,
          }))
        )
      ),

      collectionLogPages: getCollectionLogPageChanges(
        oldData?.collectionLog.tabs.flatMap((t) =>
          t.pages.map((p) => ({
            tabName: t.name,
            pageName: p.name,
            orderIdx: p.orderIdx,
          }))
        ),
        newData.collectionLog.tabs.flatMap((t) =>
          t.pages.map((e) => ({
            tabName: t.name,
            pageName: e.name,
            orderIdx: e.orderIdx,
          }))
        )
      ),
      collectionLogPageKillCounts: getCollectionLogPageKillCountChanges(
        oldData
          ? getCollectionLogPageKillCountChangesInputDataOld(oldData)
          : undefined,
        getCollectionLogPageKillCountChangesInputDataNew(newData)
      ),
      collectionLogPageItems: getCollectionLogPageItemChanges(
        oldData
          ? getCollectionLogPageItemChangesInputDataOld(oldData)
          : undefined,
        getCollectionLogPageItemChangesInputDataNew(newData)
      ),
      collectionLogItems: getCollectionLogItemChanges(
        oldData?.collectionLog.items,
        newData.collectionLog.tabs.flatMap((t) =>
          t.pages.flatMap((e) => e.items)
        )
      ),
    },
  };
}
