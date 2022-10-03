import { NextApiRequest, NextApiResponse } from "next";
import { PlayerDataSchema, TabsOrder } from "@/lib/data-schema";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { AchievementDiaryTierName, Prisma } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    return putHandler(req, res);
  }

  // if (req.method === "DELETE") {
  //   return deleteHandler(req, res);
  // }

  return res.status(405); // Method not allowed
}

async function putHandler(req: NextApiRequest, res: NextApiResponse) {
  const data = PlayerDataSchema.parse(req.body);

  const queryStart = new Date();
  console.log("Query Start: ", queryStart.toUTCString());

  const accountHash = data.accountHash;

  // Creating "VALUES" sql string from data

  // Account
  const accountValues = Prisma.sql`(${Prisma.join([
    accountHash,
    data.username,
    data.accountType,
    data.description,
    data.combatLevel,
  ])})`;

  // Skills
  const skillsValues = data.skills.map((skill) => {
    const values = Prisma.join([
      accountHash,
      skill.index,
      skill.name,
      skill.xp,
    ]);

    return Prisma.sql`(${values})`;
  });

  // Achievement Diaries
  const achievementDiaryAreasValues = data.achievementDiaries.map((diary) => {
    const values = Prisma.join([accountHash, diary.area]);

    return Prisma.sql`(${values})`;
  });

  const achievementDiaryTiersValues = data.achievementDiaries.flatMap(
    (diary) => {
      const tiers = {
        [AchievementDiaryTierName.EASY]: diary.Easy,
        [AchievementDiaryTierName.MEDIUM]: diary.Medium,
        [AchievementDiaryTierName.HARD]: diary.Hard,
        [AchievementDiaryTierName.ELITE]: diary.Elite,
      };

      return Object.entries(tiers).map(([tierName, tier]) => {
        const values = Prisma.join([
          accountHash,
          diary.area,
          tierName,
          tier.completed,
          tier.total,
        ]);

        return Prisma.sql`(${values})`;
      });
    }
  );

  // Combat Achievements
  const combatAchievementTiers = {
    EASY: data.combatAchievements.Easy,
    MEDIUM: data.combatAchievements.Medium,
    HARD: data.combatAchievements.Hard,
    ELITE: data.combatAchievements.Elite,
    MASTER: data.combatAchievements.Master,
    GRANDMASTER: data.combatAchievements.Grandmaster,
  };

  const combatAchievementTiersValues = Object.entries(
    combatAchievementTiers
  ).map(([tierName, tier]) => {
    const values = Prisma.join([
      accountHash,
      tierName,
      tier.completed,
      tier.total,
    ]);

    return Prisma.sql`(${values})`;
  });

  // Quests
  const questListValues = Prisma.sql`(${Prisma.join([
    accountHash,
    data.questList.points,
  ])})`;

  const questsValues = data.questList.quests.map((quest) => {
    const values = Prisma.join([
      accountHash,
      quest.index,
      quest.name,
      quest.state,
      quest.type,
    ]);

    return Prisma.sql`(${values})`;
  });

  // Hiscore States (Leaderboards)
  const hiscoreLeaderboards = {
    NORMAL: data.hiscores.normal,
    IRONMAN: data.hiscores.ironman,
    HARDCORE: data.hiscores.hardcore,
    ULTIMATE: data.hiscores.ultimate,
  };

  const hiscoreStatesValues = Object.keys(hiscoreLeaderboards).map(
    (leaderboardType) => {
      const values = Prisma.join([accountHash, leaderboardType]);

      return Prisma.sql`(${values})`;
    }
  );

  // Hiscore Skills
  const hiscoreSkillsValues = Object.entries(hiscoreLeaderboards).flatMap(
    ([leaderboardType, leaderboard]) => {
      return leaderboard.skills.map((skill) => {
        const values = Prisma.join([
          accountHash,
          leaderboardType,
          skill.index,
          skill.name,
          skill.rank,
          skill.level,
          skill.xp,
        ]);

        return Prisma.sql`(${values})`;
      });
    }
  );

  // Hiscore Activities
  const hiscoreActivitiesValues = Object.entries(hiscoreLeaderboards).flatMap(
    ([leaderboardType, leaderboard]) => {
      return leaderboard.activities.map((activity) => {
        const values = Prisma.join([
          accountHash,
          leaderboardType,
          activity.index,
          activity.name,
          activity.rank,
          activity.score,
        ]);

        return Prisma.sql`(${values})`;
      });
    }
  );

  // Hiscore Bosses
  const hiscoreBossesValues = Object.entries(hiscoreLeaderboards).flatMap(
    ([leaderboardType, leaderboard]) => {
      return leaderboard.bosses.map((boss) => {
        const values = Prisma.join([
          accountHash,
          leaderboardType,
          boss.index,
          boss.name,
          boss.rank,
          boss.kills,
        ]);

        return Prisma.sql`(${values})`;
      });
    }
  );

  // Collection Log
  const collectionLogValues = [
    accountHash,
    data.collectionLog.uniqueItemsObtained,
    data.collectionLog.uniqueItemsTotal,
  ];

  const tabsValues = Object.keys(data.collectionLog.tabs).map((name) => {
    const index = Object.keys(TabsOrder).indexOf(name);
    const values = Prisma.join([accountHash, index, name]);
    return Prisma.sql`(${values})`;
  });

  const entriesValues = Object.entries(data.collectionLog.tabs).flatMap(
    ([tabName, tab]) => {
      return Object.entries(tab).map(([entryName, entry]) => {
        const values = Prisma.join([
          accountHash,
          tabName,
          entry.index,
          entryName,
        ]);

        return Prisma.sql`(${values})`;
      });
    }
  );

  const itemsValues = Object.entries(data.collectionLog.tabs).flatMap(
    ([tabName, tab]) => {
      return Object.entries(tab).flatMap(([entryName, entry]) => {
        return entry.items.map((item) => {
          const values = Prisma.join([
            accountHash,
            tabName,
            entryName,
            item.index,
            item.id,
            item.name,
            item.quantity,
          ]);

          return Prisma.sql`(${values})`;
        });
      });
    }
  );

  const killCountsValues = Object.entries(data.collectionLog.tabs).flatMap(
    ([tabName, tab]) => {
      return Object.entries(tab).flatMap(([entryName, entry]) => {
        if (!entry.killCounts) return [];

        return entry.killCounts?.map((killCount) => {
          const values = Prisma.join([
            accountHash,
            tabName,
            entryName,
            killCount.index,
            killCount.name,
            killCount.count,
          ]);

          return Prisma.sql`(${values})`;
        });
      });
    }
  );

  const obtainedAtValues = Object.entries(data.collectionLog.tabs).flatMap(
    ([tabName, tab]) => {
      return Object.entries(tab).flatMap(([entryName, entry]) => {
        return entry.items.flatMap((item) => {
          if (item.quantity === 0) return [];

          const values = Prisma.join([
            accountHash,
            tabName,
            entryName,
            item.id,
          ]);

          return Prisma.sql`(${values})`;
        });
      });
    }
  );

  const obtainedAtKillCountsValues = Object.entries(
    data.collectionLog.tabs
  ).flatMap(([tabName, tab]) => {
    return Object.entries(tab).flatMap(([entryName, entry]) => {
      if (!entry.killCounts) return [];

      return entry.items.flatMap((item) => {
        if (item.quantity === 0) return [];

        return entry.killCounts!.map((killCount) => {
          const values = Prisma.join([
            accountHash,
            tabName,
            entryName,
            item.id,
            killCount.index,
            killCount.name,
            killCount.count,
          ]);

          return Prisma.sql`(${values})`;
        });
      });
    });
  });

  await prisma.$transaction([
    // Account
    prisma.$executeRaw`
      INSERT INTO Account
        (accountHash, username, accountType, description, combatLevel)
      VALUES
        ${accountValues}
      ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        accountType = VALUES(accountType),
        description = VALUES(description),
        combatLevel = VALUES(combatLevel)
    `,

    // Skills
    prisma.$executeRaw`
      INSERT INTO Skill 
        (accountHash, \`index\`, name, xp)
      VALUES
        ${Prisma.join(skillsValues)}
      ON DUPLICATE KEY UPDATE 
        \`index\` = VALUES(\`index\`),
        xp = VALUES(xp)
    `,

    // Achievement Diary Areas
    prisma.$executeRaw`
      INSERT IGNORE INTO AchievementDiary
        (accountHash, area)
      VALUES
        ${Prisma.join(achievementDiaryAreasValues)}
    `,

    // Achievement Diary Tiers
    prisma.$executeRaw`
      INSERT INTO AchievementDiaryTier
        (accountHash, area, tier, completed, total)
      VALUES
        ${Prisma.join(achievementDiaryTiersValues)}
      ON DUPLICATE KEY UPDATE
        completed = VALUES(completed),
        total = VALUES(total)
    `,

    // Combat Achievements Log
    prisma.$executeRaw`
      INSERT IGNORE INTO CombatAchievements
        (accountHash)
      VALUES
        (${accountHash})
    `,

    // Combat Achievement Tiers
    prisma.$executeRaw`
      INSERT INTO CombatAchievementTier
        (accountHash, tier, completed, total)
      VALUES
        ${Prisma.join(combatAchievementTiersValues)}
      ON DUPLICATE KEY UPDATE
        completed = VALUES(completed),
        total = VALUES(total)
    `,

    // Quest List
    prisma.$executeRaw`
      INSERT INTO QuestList
        (accountHash, points)
      VALUES
        ${questListValues}
      ON DUPLICATE KEY UPDATE
        points = VALUES(points)
    `,

    // Quests
    prisma.$executeRaw`
      INSERT INTO Quest
        (accountHash, \`index\`, name, state, type)
      VALUES
        ${Prisma.join(questsValues)}
      ON DUPLICATE KEY UPDATE
        \`index\` = VALUES(\`index\`),
        state = VALUES(state),
        type = VALUES(type)
    `,

    // Hiscore Leaderboards
    prisma.$executeRaw`
      INSERT IGNORE INTO HiscoresLeaderboard
        (accountHash, type)
      VALUES
        ${Prisma.join(hiscoreStatesValues)}
    `,

    // Hiscore Skills
    prisma.$executeRaw`
      INSERT INTO HiscoresSkill
        (accountHash, leaderboardType, \`index\`, name, \`rank\`, level, xp)
      VALUES
        ${Prisma.join(hiscoreSkillsValues)}
      ON DUPLICATE KEY UPDATE
        \`index\` = VALUES(\`index\`),
        \`rank\` = VALUES(\`rank\`),
        level = VALUES(level),
        xp = VALUES(xp)
    `,

    // Hiscore Activities
    prisma.$executeRaw`
      INSERT INTO HiscoresActivity
        (accountHash, leaderboardType, \`index\`, name, \`rank\`, score)
      VALUES
        ${Prisma.join(hiscoreActivitiesValues)}
      ON DUPLICATE KEY UPDATE
        \`index\` = VALUES(\`index\`),
        \`rank\` = VALUES(\`rank\`),
        score = VALUES(score)
    `,

    // Hiscore Bosses
    prisma.$executeRaw`
      INSERT INTO HiscoresBoss
        (accountHash, leaderboardType, \`index\`, name, \`rank\`, kills)
      VALUES
        ${Prisma.join(hiscoreBossesValues)}
      ON DUPLICATE KEY UPDATE
        \`index\` = VALUES(\`index\`),
        \`rank\` = VALUES(\`rank\`),
        kills = VALUES(kills)
    `,

    // Collection Log
    prisma.$executeRaw`
      INSERT INTO CollectionLog
        (accountHash, uniqueItemsObtained, uniqueItemsTotal)
      VALUES
        (${Prisma.join(collectionLogValues)})
      ON DUPLICATE KEY UPDATE
        uniqueItemsObtained = VALUES(uniqueItemsObtained),
        uniqueItemsTotal = VALUES(uniqueItemsTotal)
    `,

    // Tabs
    prisma.$executeRaw`
      INSERT INTO Tab 
        (accountHash, \`index\`, name)
      VALUES 
        ${Prisma.join(tabsValues)}
      ON DUPLICATE KEY UPDATE 
        \`index\` = VALUES(\`index\`)
    `,

    // Entries
    prisma.$executeRaw`
      INSERT INTO Entry 
        (accountHash, tabName, \`index\`, name)
      VALUES 
        ${Prisma.join(entriesValues)}
      ON DUPLICATE KEY UPDATE
        \`index\` = VALUES(\`index\`)
    `,

    // Items
    prisma.$executeRaw`
      INSERT INTO Item 
        (accountHash, tabName, entryName, \`index\`, id, name, quantity)
      VALUES 
        ${Prisma.join(itemsValues)}
      ON DUPLICATE KEY UPDATE
        \`index\` = VALUES(\`index\`),
        name = VALUES(name),
        quantity = VALUES(quantity)
    `,

    // Kill Counts (replaced)
    prisma.$executeRaw`
      INSERT INTO KillCount 
        (accountHash, tabName, entryName, \`index\`, name, count)
      VALUES 
        ${Prisma.join(killCountsValues)}
      ON DUPLICATE KEY UPDATE
        \`index\` = VALUES(\`index\`),
        name = VALUES(name),
        count = VALUES(count)
    `,

    // Obtained At
    prisma.$executeRaw`
      INSERT IGNORE INTO ObtainedAt 
        (accountHash, tabName, entryName, itemId)
      VALUES 
        ${Prisma.join(obtainedAtValues)}
    `,

    // Obtained At Kill Counts
    prisma.$executeRaw`
      INSERT IGNORE INTO ObtainedAtKillCount
        (accountHash, tabName, entryName, itemId, \`index\`, name, count)
      VALUES
        ${Prisma.join(obtainedAtKillCountsValues)}
    `,
  ]);

  const updatedAccount = await prisma.account.findUnique({
    where: { accountHash: accountHash },
    select: {
      username: true,
      isPrivate: true,
      generatedPath: true,
    },
  });

  if (!updatedAccount) {
    return res.status(404).json({
      error: "Account not found",
    });
  }

  const revalidates = [res.revalidate(`/u/${updatedAccount.username}`)];

  if (updatedAccount.isPrivate && updatedAccount.generatedPath) {
    revalidates.push(res.revalidate(`/u/${updatedAccount.generatedPath}`));
  }

  await Promise.all(revalidates);

  const queryEnd = new Date();
  console.log("Query End: ", queryEnd.toUTCString());

  const queryTime = queryEnd.getTime() - queryStart.getTime();
  console.log("Query Time: ", queryTime / 1000, "s");

  return res.status(200).json({
    success: true,
    message: "Data succesfully updated",
    datetime: new Date(),
    error: null,
  });
}

const DeleteBodySchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
});

// async function deleteHandler(req: NextApiRequest, res: NextApiResponse) {
//   const { accountHash } = DeleteBodySchema.parse(req.body);

//   const queryStart = new Date();
//   console.log("Query Start: ", queryStart.toUTCString());

//   const deleteQuery = e.select(
//     e.delete(e.Account, (account) => ({
//       filter: e.op(account.account_hash, "=", accountHash),
//     })),
//     () => ({
//       username: true,
//     })
//   );

//   try {
//     const result = await deleteQuery.run(edgedb);

//     if (!result) {
//       throw new Error("Failed to get username");
//     }

//     await res.revalidate(`/u/${result.username}`);

//     res.status(200).json({
//       message: "Account succesfully deleted",
//     });
//   } catch (e) {
//     console.log(e);

//     res.status(500).json({
//       message: "Failed to delete account",
//       error: e,
//     });
//   } finally {
//     const queryEnd = new Date();
//     console.log("Query End: ", queryEnd.toUTCString());

//     const queryTime = queryEnd.getTime() - queryStart.getTime();
//     console.log("Query Time: ", queryTime / 1000, "s");
//   }
// }
