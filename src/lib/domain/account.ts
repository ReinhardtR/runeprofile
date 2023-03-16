import { Activity, Boss, Skill } from "~/components/Profile/Hiscores";
import { db } from "~/db/client";
import { LeaderboardType } from "~/lib/data-schema";

export function getAccounts() {
  return db
    .selectFrom("Account")
    .select(["username", "generatedPath", "isPrivate"])
    .execute();
}

export function getAccount(username: string) {
  return db
    .selectFrom("Account")
    .select(["username", "generatedPath", "isPrivate"])
    .where("username", "=", username)
    .executeTakeFirst();
}

export async function getFullAccount(username: string) {
  const { accountHash, ...account } = await db
    .selectFrom("Account")
    .select([
      "accountHash",
      "username",
      "accountType",
      "createdAt",
      "updatedAt",
      "description",
      "combatLevel",
      "modelUri",
    ])
    .where("username", "=", username)
    .executeTakeFirstOrThrow();

  const [
    skills,
    questList,
    collectionLog,
    achievementDiaries,
    combatAchievements,
    hiscores,
  ] = await Promise.all([
    getSkills(accountHash),
    getQuestList(accountHash),
    getCollectionLog(accountHash),
    getAchievementDiaries(accountHash),
    getCombatAchievements(accountHash),
    getHiscores(accountHash),
  ]);

  return {
    ...account,
    skills,
    questList,
    collectionLog,
    achievementDiaries,
    combatAchievements,
    hiscores,
  };
}

function getSkills(accountHash: string) {
  return db
    .selectFrom("Skill")
    .select(["name", "xp"])
    .where("accountHash", "=", accountHash)
    .orderBy("index", "asc")
    .execute();
}

async function getQuestList(accountHash: string) {
  const [questList, quests] = await Promise.all([
    db
      .selectFrom("QuestList")
      .select(["points"])
      .where("accountHash", "=", accountHash)
      .executeTakeFirstOrThrow(),
    // ---
    db
      .selectFrom("Quest")
      .select(["name", "state", "type"])
      .where("accountHash", "=", accountHash)
      .orderBy("index", "asc")
      .execute(),
  ]);

  return {
    ...questList,
    quests,
  };
}

// Collection Log
async function getCollectionLog(accountHash: string) {
  const [log, entries, killCounts] = await Promise.all([
    // log
    db
      .selectFrom("CollectionLog")
      .select(["uniqueItemsObtained", "uniqueItemsTotal"])
      .where("accountHash", "=", accountHash)
      .executeTakeFirstOrThrow(),
    // entries
    db
      .selectFrom("Entry")
      .leftJoin("Item", (join) =>
        join
          .onRef("Entry.accountHash", "=", "Item.accountHash")
          .onRef("Entry.name", "=", "Item.entryName")
          .onRef("Entry.tabName", "=", "Item.tabName")
      )
      .select([
        "Entry.name",
        "Entry.tabName",
        (eb) => eb.fn.count("Item.entryName").as("totalItemsCount"),
        (eb) => eb.fn.sum("Item.quantity").as("obtainedItemsCount"),
      ])
      .where("Entry.accountHash", "=", accountHash)
      .groupBy(["Entry.name", "Entry.tabName"])
      .orderBy("Entry.index", "asc")
      .execute(),
    // kill counts
    db
      .selectFrom("KillCount")
      .select(["tabName", "entryName", "name", "count"])
      .where("accountHash", "=", accountHash)
      .orderBy("index", "asc")
      .execute(),
  ]);

  const tabs: {
    name: string;
    entries: {
      name: string;
      isCompleted: boolean;
      killCounts: {
        name: string;
        count: number;
      }[];
    }[];
  }[] = [];

  // group by tab name
  entries.forEach((entry) => {
    const { tabName, ...rest } = entry;

    const entryKillCounts = killCounts
      .filter(
        (killCount) =>
          killCount.tabName === tabName && killCount.entryName === entry.name
      )
      .map((killCount) => ({
        name: killCount.name,
        count: killCount.count,
      }));

    const fullEntry = {
      ...rest,
      isCompleted: entry.totalItemsCount === entry.obtainedItemsCount,
      killCounts: entryKillCounts,
    };

    const tab = tabs.find((tab) => tab.name === tabName);

    if (!tab) {
      tabs.push({
        name: tabName,
        entries: [fullEntry],
      });
    } else {
      tab.entries.push(fullEntry);
    }
  });

  return {
    ...log,
    tabs,
  };
}

// Achievement Diaries
async function getAchievementDiaries(accountHash: string) {
  const result = await db
    .selectFrom("AchievementDiaryTier")
    .select(["area", "tier", "completed", "total"])
    .where("accountHash", "=", accountHash)
    .orderBy("area", "asc")
    .execute();

  // format into [{area: name, tiers :[]}]

  const diaries: {
    area: string;
    tiers: {
      tier: string;
      completed: number;
      total: number;
    }[];
  }[] = [];

  result.forEach((row) => {
    const { area, ...rest } = row;

    const diary = diaries.find((diary) => diary.area === area);

    if (!diary) {
      diaries.push({
        area,
        tiers: [rest],
      });
    } else {
      diary.tiers.push(rest);
    }
  });

  return diaries;
}

// Combat Achievements
function getCombatAchievements(accountHash: string) {
  return db
    .selectFrom("CombatAchievementTier")
    .select(["tier", "completed", "total"])
    .where("accountHash", "=", accountHash)
    .orderBy("tier", "asc")
    .execute();
}

// Hiscores
async function getHiscores(accountHash: string) {
  const [skills, activities, bosses] = await Promise.all([
    getHiscoresSkills(accountHash),
    getHiscoresActivities(accountHash),
    getHiscoresBosses(accountHash),
  ]);

  const hiscores: {
    type: LeaderboardType;
    skills: Skill[];
    activities: Activity[];
    bosses: Boss[];
  }[] = [];

  skills.forEach((skill) => {
    const { leaderboardType, ...rest } = skill;

    const leaderboard = hiscores.find(
      (leaderboard) => leaderboard.type === leaderboardType
    );

    if (!leaderboard) {
      hiscores.push({
        type: leaderboardType,
        skills: [rest],
        activities: [],
        bosses: [],
      });
    } else {
      leaderboard.skills.push(rest);
    }
  });

  activities.forEach((activity) => {
    const { leaderboardType, ...rest } = activity;

    const leaderboard = hiscores.find(
      (leaderboard) => leaderboard.type === leaderboardType
    );

    if (!leaderboard) {
      hiscores.push({
        type: leaderboardType,
        skills: [],
        activities: [rest],
        bosses: [],
      });
    } else {
      leaderboard.activities.push(rest);
    }
  });

  bosses.forEach((boss) => {
    const { leaderboardType, ...rest } = boss;

    const leaderboard = hiscores.find(
      (leaderboard) => leaderboard.type === leaderboardType
    );

    if (!leaderboard) {
      hiscores.push({
        type: leaderboardType,
        skills: [],
        activities: [],
        bosses: [rest],
      });
    } else {
      leaderboard.bosses.push(rest);
    }
  });

  // sort by the keys in leaderboard type enum
  hiscores.sort((a, b) => {
    const aIndex = Object.keys(LeaderboardType).indexOf(a.type);
    const bIndex = Object.keys(LeaderboardType).indexOf(b.type);

    return aIndex - bIndex;
  });

  return hiscores;
}

function getHiscoresSkills(accountHash: string) {
  return db
    .selectFrom("HiscoresSkill")
    .select(["index", "leaderboardType", "name", "rank", "level", "xp"])
    .where("accountHash", "=", accountHash)
    .orderBy("index", "asc")
    .execute();
}

function getHiscoresActivities(accountHash: string) {
  return db
    .selectFrom("HiscoresActivity")
    .select(["index", "leaderboardType", "name", "rank", "score"])
    .where("accountHash", "=", accountHash)
    .orderBy("index", "asc")
    .execute();
}

function getHiscoresBosses(accountHash: string) {
  return db
    .selectFrom("HiscoresBoss")
    .select(["index", "leaderboardType", "name", "rank", "kills"])
    .where("accountHash", "=", accountHash)
    .orderBy("index", "asc")
    .execute();
}
