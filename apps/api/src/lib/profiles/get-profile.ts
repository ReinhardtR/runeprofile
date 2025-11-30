import { SQL, and, desc, eq, not } from "drizzle-orm";

import { Database, accounts, lower } from "@runeprofile/db";
import {
  ACHIEVEMENT_DIARIES,
  ACHIEVEMENT_DIARY_TIER_NAMES,
  AccountTypes,
  ActivityEvent,
  ActivityEventType,
  COLLECTION_LOG_ITEMS,
  COMBAT_ACHIEVEMENT_TIERS,
  QUESTS,
  SKILLS,
} from "@runeprofile/runescape";

import { RuneProfileAccountNotFoundError } from "~/lib/errors";

export type Profile = Awaited<ReturnType<typeof getProfile>>;

export function getProfileByUsername(db: Database, username: string) {
  return getProfile(db, eq(lower(accounts.username), username.toLowerCase()));
}

export function getProfileById(db: Database, id: string) {
  return getProfile(db, eq(accounts.id, id));
}

async function getProfile(db: Database, condition: SQL) {
  const profile = await db.query.accounts.findFirst({
    where: condition,
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
    throw RuneProfileAccountNotFoundError;
  }

  const [recentItems, recentActivities] = await Promise.all([
    db.query.activities.findMany({
      where: (table) =>
        and(
          eq(table.accountId, profile.id),
          eq(table.type, "new_item_obtained"),
        ),
      orderBy: (table) => [desc(table.createdAt), desc(table.id)],
      limit: 10,
      columns: {
        type: true,
        data: true,
      },
    }),
    db.query.activities.findMany({
      where: (table) =>
        and(
          eq(table.accountId, profile.id),
          not(eq(table.type, "new_item_obtained")),
        ),
      orderBy: (table) => [desc(table.createdAt), desc(table.type)],
      limit: 10,
      columns: {
        type: true,
        data: true,
      },
    }),
  ]);

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
      type: quest?.type || -1,
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

  const isClanFilled =
    !!profile.clanName &&
    profile.clanRank !== null &&
    profile.clanIcon !== null &&
    !!profile.clanTitle;

  const clan = isClanFilled
    ? {
        name: profile.clanName!,
        rank: profile.clanRank!,
        icon: profile.clanIcon!,
        title: profile.clanTitle!,
      }
    : null;

  return {
    username: profile.username,
    accountType,
    clan,
    defaultClogPage: profile.defaultClogPage,

    recentItems: recentItems as Array<
      Extract<
        ActivityEvent,
        { type: typeof ActivityEventType.NEW_ITEM_OBTAINED }
      >
    >,
    recentActivities: recentActivities as Array<
      Exclude<
        ActivityEvent,
        { type: typeof ActivityEventType.NEW_ITEM_OBTAINED }
      >
    >,

    skills,
    quests,
    items,
    achievementDiaryTiers,
    combatAchievementTiers,

    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
