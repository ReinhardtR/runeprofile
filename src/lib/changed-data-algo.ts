import type {
  AccountType,
  AchievementDiaryTierName,
  CombatAchievementTierName,
  FullAccountWithAccountHash,
  LeaderboardType,
  QuestState,
  QuestType,
} from "~/lib/domain/profile-data-types";
import type { PluginAccountData } from "~/lib/plugin-data-schema";

export function getChangedData(data: {
  oldData: FullAccountWithAccountHash;
  newData: PluginAccountData;
}): ChangedAccountData {
  const { oldData, newData } = data;

  if (oldData.accountHash != newData.accountHash) {
    throw new Error("Account hash mismatch");
  }

  const changedData: ChangedAccountData = {
    _accountHash: oldData.accountHash,
  };

  // Account
  if (
    oldData.username != newData.username ||
    oldData.accountType != newData.accountType ||
    oldData.combatLevel != newData.combatLevel
  ) {
    changedData.account = {
      username: newData.username,
      accountType: newData.accountType,
      combatLevel: newData.combatLevel,
    };
  }

  // Skills
  newData.skills.forEach((newSkill) => {
    const oldSkill = oldData.skills.find((s) => s.name == newSkill.name);

    const skillHasChanged =
      !oldSkill || //
      oldSkill.index != newSkill.index ||
      oldSkill.xp != newSkill.xp;

    if (skillHasChanged) {
      changedData.skills ||= [];
      changedData.skills.push(newSkill);
    }
  });

  // Achievement Diaries
  newData.achievementDiaries.forEach((newDiary) => {
    const oldDiary = oldData.achievementDiaries.find(
      (a) => a.area == newDiary.area
    );

    const diaryHasChanged = !oldDiary;

    if (diaryHasChanged) {
      changedData.achievementDiaries ||= [];
      changedData.achievementDiaries.push({
        area: newDiary.area,
      });
    }

    const { area, ...newTiers } = newDiary;
    Object.entries(newTiers).forEach(([tierName, newTier]) => {
      const tierNameUpper = tierName.toUpperCase() as AchievementDiaryTierName;

      const oldTier = oldDiary?.tiers.find((t) => t.tier == tierNameUpper);

      const diaryTierHasChanged =
        !oldTier || //
        oldTier.completed != newTier.completed ||
        oldTier.total != newTier.total;

      if (diaryTierHasChanged) {
        changedData.achievementDiaryTiers ||= [];
        changedData.achievementDiaryTiers.push({
          area,
          tier: tierNameUpper,
          completed: newTier.completed,
          total: newTier.total,
        });
      }
    });
  });

  // Combat Achievements
  Object.entries(newData.combatAchievements).forEach(([tierName, newTier]) => {
    const tierNameUpper = tierName.toUpperCase() as CombatAchievementTierName;

    const oldTier = oldData.combatAchievements.find(
      (t) => t.tier == tierNameUpper
    );

    const tierHasChanged =
      !oldTier || //
      oldTier.completed != newTier.completed ||
      oldTier.total != newTier.total;

    if (tierHasChanged) {
      changedData.combatAchievementTiers ||= [];
      changedData.combatAchievementTiers.push({
        tier: tierNameUpper,
        completed: newTier.completed,
        total: newTier.total,
      });
    }
  });

  // Quest List and Quests
  if (newData.questList.points != oldData.questList.points) {
    changedData.questList = {
      points: newData.questList.points,
    };
  }

  newData.questList.quests.forEach((newQuest) => {
    const oldQuest = oldData.questList.quests.find(
      (q) => q.name == newQuest.name
    );

    const questHasChanged =
      !oldQuest || //
      oldQuest.index != newQuest.index ||
      oldQuest.state != newQuest.state ||
      oldQuest.type != newQuest.type;

    if (questHasChanged) {
      changedData.quests ||= [];
      changedData.quests.push(newQuest);
    }
  });

  // Hiscores Leaderboards
  Object.entries(newData.hiscores).forEach(([type, newLeaderboard]) => {
    const leaderboardTypeUpper = type.toUpperCase() as LeaderboardType;

    const oldLeaderboard = oldData.hiscores.find(
      (l) => l.type == leaderboardTypeUpper
    );

    const leaderboardHasChanged = !oldLeaderboard;

    if (leaderboardHasChanged) {
      changedData.hiscoresLeaderboards ||= [];
      changedData.hiscoresLeaderboards.push({
        type: leaderboardTypeUpper,
      });
    }

    // Hiscores Skills
    newLeaderboard.skills.forEach((newSkill) => {
      const oldSkill = oldLeaderboard?.skills.find(
        (s) => s.name == newSkill.name
      );

      const skillHasChanged =
        !oldSkill || //
        oldSkill.index != newSkill.index ||
        oldSkill.rank != newSkill.rank ||
        oldSkill.level != newSkill.level ||
        oldSkill.xp != newSkill.xp;

      if (skillHasChanged) {
        changedData.hiscoresSkills ||= [];
        changedData.hiscoresSkills.push({
          leaderboardType: leaderboardTypeUpper,
          index: newSkill.index,
          name: newSkill.name,
          rank: newSkill.rank,
          level: newSkill.level,
          xp: newSkill.xp,
        });
      }
    });

    // Hiscores Bosses
    newLeaderboard.bosses.forEach((newBoss) => {
      const oldBoss = oldLeaderboard?.bosses.find(
        (b) => b.name == newBoss.name
      );

      const bossHasChanged =
        !oldBoss || //
        oldBoss.index != newBoss.index ||
        oldBoss.rank != newBoss.rank ||
        oldBoss.kills != newBoss.kills;

      if (bossHasChanged) {
        changedData.hiscoresBosses ||= [];
        changedData.hiscoresBosses.push({
          leaderboardType: leaderboardTypeUpper,
          index: newBoss.index,
          name: newBoss.name,
          rank: newBoss.rank,
          kills: newBoss.kills,
        });
      }
    });

    // Hiscores Activities
    newLeaderboard.activities.forEach((newActivity) => {
      const oldActivity = oldLeaderboard?.activities.find(
        (a) => a.name == newActivity.name
      );

      const activityHasChanged =
        !oldActivity || //
        oldActivity.index != newActivity.index ||
        oldActivity.rank != newActivity.rank ||
        oldActivity.score != newActivity.score;

      if (activityHasChanged) {
        changedData.hiscoresActivities ||= [];
        changedData.hiscoresActivities.push({
          leaderboardType: leaderboardTypeUpper,
          index: newActivity.index,
          name: newActivity.name,
          rank: newActivity.rank,
          score: newActivity.score,
        });
      }
    });
  });

  // Collection Log
  const collectionLogHasChanged =
    newData.collectionLog.uniqueItemsObtained !=
      oldData.collectionLog.uniqueItemsObtained ||
    newData.collectionLog.uniqueItemsTotal !=
      oldData.collectionLog.uniqueItemsTotal;

  if (collectionLogHasChanged) {
    changedData.collectionLog = {
      uniqueItemsObtained: newData.collectionLog.uniqueItemsObtained,
      uniqueItemsTotal: newData.collectionLog.uniqueItemsTotal,
    };
  }

  // Tabs
  Object.entries(newData.collectionLog.tabs).forEach(([tabName, newTab]) => {
    const oldTab = oldData.collectionLog.tabs.find((t) => t.name == tabName);

    const tabHasChanged = !oldTab;

    if (tabHasChanged) {
      changedData.collectionLogTabs ||= [];
      changedData.collectionLogTabs.push({
        name: tabName,
      });
    }

    // Entries
    Object.entries(newTab).forEach(([entryName, newEntry]) => {
      const oldEntry = oldTab?.entries.find((e) => e.name == entryName);

      const entryHasChanged =
        !oldEntry || //
        oldEntry.index != newEntry.index;

      if (entryHasChanged) {
        changedData.collectionLogEntries ||= [];
        changedData.collectionLogEntries.push({
          tabName,
          index: newEntry.index,
          name: entryName,
        });
      }

      // Items
      newEntry.items.forEach((newItem) => {
        const oldItem = oldEntry?.items.find((i) => i.id == newItem.id);

        const itemHasChanged =
          !oldItem || //
          oldItem.index != newItem.index ||
          oldItem.name != newItem.name ||
          oldItem.quantity != newItem.quantity;

        if (itemHasChanged) {
          changedData.collectionLogItems ||= [];
          changedData.collectionLogItems.push({
            tabName,
            entryName,
            index: newItem.index,
            id: newItem.id,
            name: newItem.name,
            quantity: newItem.quantity,
          });
        }

        // Obtained At
        const isNewlyObtained =
          !oldItem || (oldItem.quantity <= 0 && newItem.quantity > 0);

        if (isNewlyObtained) {
          changedData.collectionLogObtainedAt ||= [];
          changedData.collectionLogObtainedAt.push({
            tabName,
            entryName,
            itemId: newItem.id,
          });

          // Obtained At Kill Counts
          if (newEntry.killCounts && newEntry.killCounts.length > 0) {
            newEntry.killCounts.forEach((newKillCount) => {
              changedData.collectionLogObtainedAtKillCounts ||= [];
              changedData.collectionLogObtainedAtKillCounts.push({
                tabName,
                entryName,
                itemId: newItem.id,
                index: newKillCount.index,
                name: newKillCount.name,
                count: newKillCount.count,
              });
            });
          }
        }
      });

      // Kill Counts
      newEntry.killCounts?.forEach((newKillCount) => {
        const oldKillCount = oldEntry?.killCounts?.find(
          (k) => k.name == newKillCount.name
        );

        const killCountHasChanged =
          !oldKillCount || //
          oldKillCount.index != newKillCount.index ||
          oldKillCount.name != newKillCount.name ||
          oldKillCount.count != newKillCount.count;

        if (killCountHasChanged) {
          changedData.collectionLogEntryKillCounts ||= [];
          changedData.collectionLogEntryKillCounts.push({
            tabName,
            entryName,
            index: newKillCount.index,
            name: newKillCount.name,
            count: newKillCount.count,
          });
        }
      });
    });
  });

  return changedData;
}

export type AccountData = {
  username: string;
  accountType: AccountType;
  combatLevel: number;
};

export type SkillData = {
  index: number;
  name: string;
  xp: number;
};

export type AchievementDiaryData = {
  area: string;
};

export type AchievementDiaryTierData = {
  area: string;
  tier: AchievementDiaryTierName;
  completed: number;
  total: number;
};

export type CombatAchievementTierData = {
  tier: CombatAchievementTierName;
  completed: number;
  total: number;
};

export type QuestListData = {
  points: number;
};

export type QuestData = {
  index: number;
  name: string;
  state: QuestState;
  type: QuestType;
};

export type HiscoresLeaderboardsData = {
  type: LeaderboardType;
};

export type HiscoresSkillsData = {
  leaderboardType: LeaderboardType;
  index: number;
  name: string;
  rank: number;
  level: number;
  xp: number;
};

export type HiscoresActivitiesData = {
  leaderboardType: LeaderboardType;
  index: number;
  name: string;
  rank: number;
  score: number;
};

export type HiscoresBossesData = {
  leaderboardType: LeaderboardType;
  index: number;
  name: string;
  rank: number;
  kills: number;
};

export type CollectionLogData = {
  uniqueItemsObtained: number;
  uniqueItemsTotal: number;
};

export type CollectionLogTabsData = {
  name: string;
};

export type CollectionLogEntriesData = {
  tabName: string;
  index: number;
  name: string;
};

export type CollectionLogEntryKillCountsData = {
  tabName: string;
  entryName: string;
  index: number;
  name: string;
  count: number;
};

export type CollectionLogItemsData = {
  tabName: string;
  entryName: string;
  index: number;
  id: number;
  name: string;
  quantity: number;
};

export type CollectionLogObtainedAtData = {
  tabName: string;
  entryName: string;
  itemId: number;
};

export type CollectionLogObtainedAtKillCountsData = {
  tabName: string;
  entryName: string;
  itemId: number;
  index: number;
  name: string;
  count: number;
};

export type ChangedAccountData = {
  _accountHash: string;
  account?: AccountData;
  skills?: SkillData[];
  achievementDiaries?: AchievementDiaryData[];
  achievementDiaryTiers?: AchievementDiaryTierData[];
  combatAchievementTiers?: CombatAchievementTierData[];
  questList?: QuestListData;
  quests?: QuestData[];
  hiscoresLeaderboards?: HiscoresLeaderboardsData[];
  hiscoresSkills?: HiscoresSkillsData[];
  hiscoresActivities?: HiscoresActivitiesData[];
  hiscoresBosses?: HiscoresBossesData[];
  collectionLog?: CollectionLogData;
  collectionLogTabs?: CollectionLogTabsData[];
  collectionLogEntries?: CollectionLogEntriesData[];
  collectionLogEntryKillCounts?: CollectionLogEntryKillCountsData[];
  collectionLogItems?: CollectionLogItemsData[];
  collectionLogObtainedAt?: CollectionLogObtainedAtData[];
  collectionLogObtainedAtKillCounts?: CollectionLogObtainedAtKillCountsData[];
};
