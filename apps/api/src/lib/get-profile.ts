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
          id: true,
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
          id: true,
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
    const skill = SKILLS.find((skill) => skill.id === profileSkill.id);
    return {
      id: profileSkill.id,
      name: skill?.name || "Unknown",
      xp: profileSkill.xp,
    };
  });

  const achievementDiaryTiers = profile.achievementDiaryTiers.map(
    (profileTier) => {
      const area = ACHIEVEMENT_DIARIES.find(
        (tier) => profileTier.id === tier.id,
      );
      const tierIndex = profileTier.tier - 1;
      return {
        id: profileTier.id,
        area: area?.name || "Unknown",
        tier: ACHIEVEMENT_DIARY_TIER_NAMES[tierIndex] || "Unknown",
        completedCount: profileTier.completedCount,
        tasksCount: area?.tiers[tierIndex] || 0,
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
    const item = COLLECTION_LOG_ITEMS.find(
      (item) => item.id === profileItem.id,
    );
    return {
      id: profileItem.id,
      name: item?.name || "Unknown",
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
