import { eq } from "drizzle-orm";

import {
  ACHIEVEMENT_DIARIES,
  ACHIEVEMENT_DIARY_TIER_NAMES,
  AccountTypes,
  COLLECTION_LOG_ITEMS,
  COMBAT_ACHIEVEMENT_TIERS,
  QUESTS,
  SKILLS,
} from "@runeprofile/runescape";

import { Database, accounts } from "~/db";
import { lower } from "~/db/helpers";

export async function getProfile(db: Database, username: string) {
  const profile = await db.query.accounts.findFirst({
    where: eq(lower(accounts.username), username.toLowerCase()),
    with: {
      achievementDiaryTiers: {
        columns: {
          areaId: true,
          tier: true,
          completedCount: true,
        },
      },
      combatAchievementTiers: {
        columns: {
          id: true,
          completedCount: true,
        },
      },
      items: {
        columns: {
          id: true,
          quantity: true,
          createdAt: true,
        },
      },
      quests: {
        columns: {
          id: true,
          state: true,
        },
      },
      skills: {
        columns: {
          name: true,
          xp: true,
        },
      },
    },
  });

  if (!profile) {
    return undefined;
  }

  const accountType =
    AccountTypes.find((type) => type.id === profile.accountType) ||
    AccountTypes[0];

  const skills = profile.skills.map((profileSkill) => {
    const skillName = SKILLS.find(
      (skillName) => skillName === profileSkill.name,
    );
    return {
      name: skillName || "Unknown",
      xp: profileSkill.xp,
    };
  });

  const achievementDiaryTiers = profile.achievementDiaryTiers.map(
    (profileTier) => {
      const area = ACHIEVEMENT_DIARIES.find(
        (tier) => profileTier.areaId === tier.id,
      );
      return {
        areaId: profileTier.areaId,
        area: area?.name || "Unknown",
        tierIndex: profileTier.tier,
        tierName: ACHIEVEMENT_DIARY_TIER_NAMES[profileTier.tier] || "Unknown",
        completedCount: profileTier.completedCount,
        tasksCount: area?.tiers[profileTier.tier] || 0,
      };
    },
  );

  const combatAchievementTiers = profile.combatAchievementTiers.map(
    (profileTier) => {
      const tier = COMBAT_ACHIEVEMENT_TIERS.find(
        (tier) => tier.id === profileTier.id,
      );
      return {
        id: profileTier.id,
        name: tier?.name || "Unknown",
        completedCount: profileTier.completedCount,
        tasksCount: tier?.tasksCount || 0,
      };
    },
  );

  const quests = profile.quests.map((profileQuest) => {
    const quest = QUESTS.find((quest) => quest.id === profileQuest.id);
    return {
      id: profileQuest.id,
      name: quest?.name || "Unknown",
      state: profileQuest.state,
      type: quest?.type || "Unknown",
    };
  });

  const items = profile.items.map((profileItem) => {
    const itemName = COLLECTION_LOG_ITEMS[profileItem.id];
    return {
      id: profileItem.id,
      name: itemName || "Unknown",
      quantity: profileItem.quantity,
      createdAt: profileItem.createdAt,
    };
  });

  return {
    username: profile.username,
    accountType,
    skills,
    quests,
    items,
    achievementDiaryTiers,
    combatAchievementTiers,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
