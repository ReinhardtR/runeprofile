import { NextApiRequest, NextApiResponse } from "next";
import { PlayerDataSchema, TabsOrder } from "@/lib/data-schema";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { AchievementDiaryTierName, Prisma } from "@prisma/client";
import { startRevalidateTask } from "@/lib/start-revalidate-task";
import { withAxiom } from "next-axiom";
import type { AxiomAPIRequest } from "next-axiom/dist/withAxiom";

async function handler(req: AxiomAPIRequest, res: NextApiResponse) {
  if (req.method === "PUT") {
    return putHandler(req, res);
  }

  if (req.method === "DELETE") {
    return deleteHandler(req, res);
  }

  return res.status(405).end(); // Method not allowed
}

export default withAxiom(handler);

async function putHandler(req: AxiomAPIRequest, res: NextApiResponse) {
  const data = PlayerDataSchema.parse(req.body);

  req.log.info("Update Profile API Request Body", {
    skills: data.skills,
    questList: data.questList,
    achievementsDiaries: data.achievementDiaries,
    combatAchievements: data.combatAchievements,
    hiscores: data.hiscores,
    collectionLog: data.collectionLog,
  });

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

  const queries = [
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

    // Combat Achievements Log
    prisma.$executeRaw`
      INSERT IGNORE INTO CombatAchievements
        (accountHash)
      VALUES
        (${accountHash})
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
  ];

  // Skills
  if (skillsValues.length > 0) {
    queries.push(
      // Skills
      prisma.$executeRaw`
      INSERT INTO Skill 
        (accountHash, \`index\`, name, xp)
      VALUES
        ${Prisma.join(skillsValues)}
      ON DUPLICATE KEY UPDATE 
        \`index\` = VALUES(\`index\`),
        xp = VALUES(xp)
    `
    );
  }

  // Quests
  if (questsValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
      INSERT INTO Quest
        (accountHash, \`index\`, name, state, type)
      VALUES
        ${Prisma.join(questsValues)}
      ON DUPLICATE KEY UPDATE
        \`index\` = VALUES(\`index\`),
        state = VALUES(state),
        type = VALUES(type)
    `
    );
  }

  // Achievement Diary Areas
  if (achievementDiaryAreasValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
      INSERT IGNORE INTO AchievementDiary
        (accountHash, area)
      VALUES
        ${Prisma.join(achievementDiaryAreasValues)}
    `
    );
  }

  // Achievement Diary Tiers
  if (achievementDiaryTiersValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
      INSERT INTO AchievementDiaryTier
        (accountHash, area, tier, completed, total)
      VALUES
        ${Prisma.join(achievementDiaryTiersValues)}
      ON DUPLICATE KEY UPDATE
        completed = VALUES(completed),
        total = VALUES(total)
    `
    );
  }

  // Combat Achievement Tiers
  if (combatAchievementTiersValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
      INSERT INTO CombatAchievementTier
        (accountHash, tier, completed, total)
      VALUES
        ${Prisma.join(combatAchievementTiersValues)}
      ON DUPLICATE KEY UPDATE
        completed = VALUES(completed),
        total = VALUES(total)
    `
    );
  }

  // Hiscores Leaderboards
  if (hiscoreStatesValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
      INSERT IGNORE INTO HiscoresLeaderboard
        (accountHash, type)
      VALUES
        ${Prisma.join(hiscoreStatesValues)}
    `
    );
  }

  // Hiscore Skills
  if (hiscoreSkillsValues.length > 0) {
    queries.push(
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
    `
    );
  }

  // Hiscore Activities
  if (hiscoreActivitiesValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
      INSERT INTO HiscoresActivity
        (accountHash, leaderboardType, \`index\`, name, \`rank\`, score)
      VALUES
        ${Prisma.join(hiscoreActivitiesValues)}
      ON DUPLICATE KEY UPDATE
        \`index\` = VALUES(\`index\`),
        \`rank\` = VALUES(\`rank\`),
        score = VALUES(score)
    `
    );
  }

  // Hiscore Bosses
  if (hiscoreBossesValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
      INSERT INTO HiscoresBoss
        (accountHash, leaderboardType, \`index\`, name, \`rank\`, kills)
      VALUES
        ${Prisma.join(hiscoreBossesValues)}
      ON DUPLICATE KEY UPDATE
        \`index\` = VALUES(\`index\`),
        \`rank\` = VALUES(\`rank\`),
        kills = VALUES(kills)
    `
    );
  }

  // Collection Log
  if (collectionLogValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
        INSERT INTO CollectionLog
          (accountHash, uniqueItemsObtained, uniqueItemsTotal)
        VALUES
          (${Prisma.join(collectionLogValues)})
        ON DUPLICATE KEY UPDATE
          uniqueItemsObtained = VALUES(uniqueItemsObtained),
          uniqueItemsTotal = VALUES(uniqueItemsTotal)
      `
    );
  }

  // Tabs
  if (tabsValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
        INSERT INTO Tab 
          (accountHash, \`index\`, name)
        VALUES 
          ${Prisma.join(tabsValues)}
        ON DUPLICATE KEY UPDATE 
          \`index\` = VALUES(\`index\`)
      `
    );
  }

  // Entries
  if (entriesValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
        INSERT INTO Entry 
          (accountHash, tabName, \`index\`, name)
        VALUES 
          ${Prisma.join(entriesValues)}
        ON DUPLICATE KEY UPDATE
          \`index\` = VALUES(\`index\`)
      `
    );
  }

  // Items
  if (itemsValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
        INSERT INTO Item 
          (accountHash, tabName, entryName, \`index\`, id, name, quantity)
        VALUES 
          ${Prisma.join(itemsValues)}
        ON DUPLICATE KEY UPDATE
          \`index\` = VALUES(\`index\`),
          name = VALUES(name),
          quantity = VALUES(quantity)
      `
    );
  }

  // Obtained At Kill Counts
  if (obtainedAtKillCountsValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
        INSERT IGNORE INTO ObtainedAtKillCount
          (accountHash, tabName, entryName, itemId, \`index\`, name, count)
        VALUES
          ${Prisma.join(obtainedAtKillCountsValues)}
      `
    );
  }

  // Obtained At
  if (obtainedAtValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
        INSERT IGNORE INTO ObtainedAt 
          (accountHash, tabName, entryName, itemId)
        VALUES 
          ${Prisma.join(obtainedAtValues)}
      `
    );
  }

  // Kill Counts (replaced)
  if (killCountsValues.length > 0) {
    queries.push(
      prisma.$executeRaw`
        INSERT INTO KillCount 
          (accountHash, tabName, entryName, \`index\`, name, count)
        VALUES 
          ${Prisma.join(killCountsValues)}
        ON DUPLICATE KEY UPDATE
          \`index\` = VALUES(\`index\`),
          name = VALUES(name),
          count = VALUES(count)
      `
    );
  }

  await prisma.$transaction(queries);

  const updatedAccount = await prisma.account.findUnique({
    where: { accountHash },
    select: {
      accountHash: true,
    },
  });

  if (!updatedAccount) {
    return res.status(404).json({
      error: "Account not found",
    });
  }

  await startRevalidateTask(req, updatedAccount.accountHash);

  // Logs
  const queryEnd = new Date();
  console.log("Query End: ", queryEnd.toUTCString());

  const queryTime = queryEnd.getTime() - queryStart.getTime();
  console.log("Query Time: ", queryTime / 1000, "s");

  return res.status(200).end();
}

const DeleteBodySchema = z.object({
  accountHash: PlayerDataSchema.shape.accountHash,
});

async function deleteHandler(req: NextApiRequest, res: NextApiResponse) {
  const { accountHash } = DeleteBodySchema.parse(req.body);

  const deletedAccount = await prisma.account.delete({
    where: { accountHash },
    select: {
      accountHash: true,
    },
  });

  if (!deletedAccount) {
    return res.status(404).end();
  }

  await startRevalidateTask(req, deletedAccount.accountHash);

  return res.status(200).end();
}
