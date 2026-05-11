import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import {
  accounts,
  achievementDiaryTiers as achievementDiaryTiersTable,
  combatAchievementTiers as combatAchievementTiersTable,
  items,
  lower,
  quests as questsTable,
  skills as skillsTable,
} from "@runeprofile/db";
import { drizzle } from "@runeprofile/db";
import {
  ACHIEVEMENT_DIARIES,
  ACHIEVEMENT_DIARY_TIER_NAMES,
  AccountTypes,
  COLLECTION_LOG_ITEMS,
  COLLECTION_LOG_ITEM_IDS,
  COLLECTION_LOG_TABS,
  COMBAT_ACHIEVEMENT_TIERS,
  QUESTS,
  QuestState,
  QuestType,
  SKILLS,
  getCombatAchievementTierTaskCount,
  getLevelFromXP,
  getVirtualLevelFromXP,
  getXPUntilNextLevel,
} from "@runeprofile/runescape";

import { STATUS } from "~/lib/status";

import { createV1App } from "../app";
import {
  AccountSummarySchema,
  AchievementDiariesResponseSchema,
  CombatAchievementsResponseSchema,
  FullProfileSchema,
  QuestsResponseSchema,
  SkillsResponseSchema,
} from "../schemas/accounts";
import {
  BadRequestResponse,
  ErrorSchema,
  InternalErrorResponse,
  RateLimitResponse,
  UsernameParam,
} from "../schemas/shared";
import { CACHE_HEADER } from "../shared";

const questTypeToString = (type: number) => {
  switch (type) {
    case QuestType.FREE:
      return "free" as const;
    case QuestType.MEMBERS:
      return "members" as const;
    case QuestType.MINI:
      return "mini" as const;
    default:
      return "free" as const;
  }
};

const questStateToString = (state: number) => {
  switch (state) {
    case QuestState.NOT_STARTED:
      return "not_started" as const;
    case QuestState.IN_PROGRESS:
      return "in_progress" as const;
    case QuestState.FINISHED:
      return "finished" as const;
    default:
      return "not_started" as const;
  }
};

async function getAccountByUsername(
  db: ReturnType<typeof drizzle>,
  username: string,
) {
  return db.query.accounts.findFirst({
    where: eq(lower(accounts.username), username.toLowerCase()),
    columns: {
      id: true,
      username: true,
      accountType: true,
      clanName: true,
      clanRank: true,
      clanIcon: true,
      clanTitle: true,
      groupName: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

function formatAccountType(accountTypeId: number) {
  return AccountTypes.find((t) => t.id === accountTypeId) ?? AccountTypes[0];
}

function formatClan(account: {
  clanName: string | null;
  clanRank: number | null;
  clanIcon: number | null;
  clanTitle: string | null;
}) {
  const filled =
    !!account.clanName &&
    account.clanRank !== null &&
    account.clanIcon !== null &&
    !!account.clanTitle;

  return filled
    ? {
        name: account.clanName!,
        rank: account.clanRank!,
        icon: account.clanIcon!,
        title: account.clanTitle!,
      }
    : null;
}

// --- Shared data formatting ---

function formatSkills(skillRows: { name: string; xp: number }[]) {
  const skillMap = new Map(skillRows.map((s) => [s.name, s.xp]));
  return SKILLS.map((name) => {
    const xp = skillMap.get(name) ?? 0;
    return {
      name,
      xp,
      level: getLevelFromXP(xp),
      virtualLevel: getVirtualLevelFromXP(xp),
      xpToNextLevel: getXPUntilNextLevel(xp),
    };
  });
}

function formatQuests(questRows: { id: number; state: number }[]) {
  const questMap = new Map(questRows.map((q) => [q.id, q.state]));
  return QUESTS.map((quest) => ({
    id: quest.id,
    name: quest.name,
    points: quest.points,
    type: questTypeToString(quest.type),
    state: questStateToString(questMap.get(quest.id) ?? QuestState.NOT_STARTED),
  }));
}

function formatAchievementDiaries(
  diaryRows: { areaId: number; tier: number; completedCount: number }[],
) {
  const diaryMap = new Map<number, Map<number, number>>();
  for (const row of diaryRows) {
    if (!diaryMap.has(row.areaId)) diaryMap.set(row.areaId, new Map());
    diaryMap.get(row.areaId)!.set(row.tier, row.completedCount);
  }
  return ACHIEVEMENT_DIARIES.map((area) => ({
    areaId: area.id,
    area: area.name,
    tiers: area.tiers.map((taskCount, tierIdx) => ({
      tier: ACHIEVEMENT_DIARY_TIER_NAMES[tierIdx] ?? "Unknown",
      completed: diaryMap.get(area.id)?.get(tierIdx) ?? 0,
      total: taskCount,
    })),
  }));
}

function formatCombatAchievements(
  combatRows: { id: number; completedCount: number }[],
  accountType: number,
) {
  const combatMap = new Map(combatRows.map((r) => [r.id, r.completedCount]));
  return COMBAT_ACHIEVEMENT_TIERS.map((tier) => ({
    id: tier.id,
    name: tier.name,
    completed: combatMap.get(tier.id) ?? 0,
    total: getCombatAchievementTierTaskCount(tier.id, accountType) ?? 0,
  }));
}

function formatCollectionLog(itemRows: { id: number; quantity: number }[]) {
  const itemMap = new Map(itemRows.map((i) => [i.id, i.quantity]));

  const totalItems = COLLECTION_LOG_ITEM_IDS.length;
  const totalObtained = COLLECTION_LOG_ITEM_IDS.filter(
    (id) => (itemMap.get(id) ?? 0) > 0,
  ).length;

  const tabs = COLLECTION_LOG_TABS.map((tab) => {
    const pages = tab.pages.map((page) => {
      let pageObtained = 0;
      const pageItems = page.items.map((itemId) => {
        const quantity = itemMap.get(itemId) ?? 0;
        if (quantity > 0) pageObtained++;
        return {
          id: itemId,
          name: COLLECTION_LOG_ITEMS[itemId] ?? "Unknown",
          quantity,
        };
      });
      return {
        name: page.name,
        obtained: pageObtained,
        total: page.items.length,
        items: pageItems,
      };
    });
    const tabObtained = pages.reduce((sum, p) => sum + p.obtained, 0);
    const tabTotal = pages.reduce((sum, p) => sum + p.total, 0);
    return { name: tab.name, obtained: tabObtained, total: tabTotal, pages };
  });

  return { obtained: totalObtained, total: totalItems, tabs };
}

// --- Route: GET /accounts/:username (summary) ---
const getSummaryRoute = createRoute({
  method: "get",
  path: "/accounts/{username}",
  tags: ["Accounts"],
  summary: "Summary",
  description:
    "Returns a high-level overview of the account's progress across all tracked categories.",
  request: {
    params: z.object({ username: UsernameParam }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: AccountSummarySchema } },
      description: "Account summary",
    },
    400: BadRequestResponse,
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Account not found",
    },
    429: RateLimitResponse,
    500: InternalErrorResponse,
  },
});

// --- Route: GET /accounts/:username/skills ---
const getSkillsRoute = createRoute({
  method: "get",
  path: "/accounts/{username}/skills",
  tags: ["Accounts"],
  summary: "Skills",
  description: "Returns the account's skill levels and experience.",
  request: {
    params: z.object({ username: UsernameParam }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: SkillsResponseSchema } },
      description: "Account skills",
    },
    400: BadRequestResponse,
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Account not found",
    },
    429: RateLimitResponse,
    500: InternalErrorResponse,
  },
});

// --- Route: GET /accounts/:username/quests ---
const getQuestsRoute = createRoute({
  method: "get",
  path: "/accounts/{username}/quests",
  tags: ["Accounts"],
  summary: "Quests",
  description: "Returns the account's quest completion status.",
  request: {
    params: z.object({ username: UsernameParam }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: QuestsResponseSchema } },
      description: "Account quests",
    },
    400: BadRequestResponse,
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Account not found",
    },
    429: RateLimitResponse,
    500: InternalErrorResponse,
  },
});

// --- Route: GET /accounts/:username/achievement-diaries ---
const getAchievementDiariesRoute = createRoute({
  method: "get",
  path: "/accounts/{username}/achievement-diaries",
  tags: ["Accounts"],
  summary: "Achievement diaries",
  description:
    "Returns achievement diary completion progress per area and tier.",
  request: {
    params: z.object({ username: UsernameParam }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: AchievementDiariesResponseSchema },
      },
      description: "Account achievement diaries",
    },
    400: BadRequestResponse,
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Account not found",
    },
    429: RateLimitResponse,
    500: InternalErrorResponse,
  },
});

// --- Route: GET /accounts/:username/combat-achievements ---
const getCombatAchievementsRoute = createRoute({
  method: "get",
  path: "/accounts/{username}/combat-achievements",
  tags: ["Accounts"],
  summary: "Combat achievements",
  description: "Returns combat achievement completion progress per tier.",
  request: {
    params: z.object({ username: UsernameParam }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: CombatAchievementsResponseSchema },
      },
      description: "Account combat achievements",
    },
    400: BadRequestResponse,
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Account not found",
    },
    429: RateLimitResponse,
    500: InternalErrorResponse,
  },
});

// --- Route: GET /accounts/:username/full ---
const getFullProfileRoute = createRoute({
  method: "get",
  path: "/accounts/{username}/full",
  tags: ["Accounts"],
  summary: "Full profile",
  description:
    "Returns the complete account profile including skills, quests, collection log, achievement diaries, and combat achievements in a single response. This is a heavy endpoint — prefer the individual endpoints unless you need all data at once.",
  request: {
    params: z.object({ username: UsernameParam }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: FullProfileSchema } },
      description: "Full account profile",
    },
    400: BadRequestResponse,
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Account not found",
    },
    429: RateLimitResponse,
    500: InternalErrorResponse,
  },
});

// --- Register routes ---
export const accountsRouter = createV1App()
  // GET /accounts/:username
  .openapi(getSummaryRoute, async (c) => {
    const { username } = c.req.valid("param");
    const db = drizzle(c.env.HYPERDRIVE);

    const account = await getAccountByUsername(db, username);
    if (!account) {
      return c.json(
        { error: "Account not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const [skillRows, questRows, itemRows, diaryRows, combatRows] =
      await Promise.all([
        db.query.skills.findMany({
          where: eq(skillsTable.accountId, account.id),
          columns: { name: true, xp: true },
        }),
        db.query.quests.findMany({
          where: eq(questsTable.accountId, account.id),
          columns: { id: true, state: true },
        }),
        db.query.items.findMany({
          where: eq(items.accountId, account.id),
          columns: { id: true },
        }),
        db.query.achievementDiaryTiers.findMany({
          where: eq(achievementDiaryTiersTable.accountId, account.id),
          columns: { areaId: true, tier: true, completedCount: true },
        }),
        db.query.combatAchievementTiers.findMany({
          where: eq(combatAchievementTiersTable.accountId, account.id),
          columns: { id: true, completedCount: true },
        }),
      ]);

    // Skills summary
    const totalLevel = skillRows.reduce(
      (sum, s) => sum + getLevelFromXP(s.xp),
      0,
    );
    const totalXp = skillRows.reduce((sum, s) => sum + s.xp, 0);

    // Quests summary
    const questLookup = new Map(questRows.map((q) => [q.id, q.state]));
    let earnedPoints = 0;
    let completed = 0;
    let started = 0;
    let notStarted = 0;
    for (const quest of QUESTS) {
      const state = questLookup.get(quest.id) ?? QuestState.NOT_STARTED;
      if (state === QuestState.FINISHED) {
        completed++;
        earnedPoints += quest.points;
      } else if (state === QuestState.IN_PROGRESS) {
        started++;
      } else {
        notStarted++;
      }
    }
    const totalPoints = QUESTS.reduce((sum, q) => sum + q.points, 0);

    // Collection log summary
    const obtainedItemIds = new Set(itemRows.map((i) => i.id));
    const totalClogItems = COLLECTION_LOG_ITEM_IDS.length;
    const clogObtained = COLLECTION_LOG_ITEM_IDS.filter((id) =>
      obtainedItemIds.has(id),
    ).length;

    // Achievement diaries summary
    const diaryMap = new Map<number, Map<number, number>>();
    for (const row of diaryRows) {
      if (!diaryMap.has(row.areaId)) diaryMap.set(row.areaId, new Map());
      diaryMap.get(row.areaId)!.set(row.tier, row.completedCount);
    }
    const achievementDiaries = ACHIEVEMENT_DIARIES.map((area) => {
      let areaCompleted = 0;
      let areaTotal = 0;
      for (let tierIdx = 0; tierIdx < area.tiers.length; tierIdx++) {
        areaTotal += area.tiers[tierIdx]!;
        areaCompleted += diaryMap.get(area.id)?.get(tierIdx) ?? 0;
      }
      return {
        areaId: area.id,
        area: area.name,
        completed: areaCompleted,
        total: areaTotal,
      };
    });

    // Combat achievements
    const combatMap = new Map(combatRows.map((r) => [r.id, r.completedCount]));
    const combatAchievements = COMBAT_ACHIEVEMENT_TIERS.map((tier) => ({
      id: tier.id,
      name: tier.name,
      completed: combatMap.get(tier.id) ?? 0,
      total:
        getCombatAchievementTierTaskCount(tier.id, account.accountType) ?? 0,
    }));

    return c.json(
      {
        username: account.username,
        accountType: formatAccountType(account.accountType),
        clan: formatClan(account),
        groupName: account.groupName,
        skills: { totalLevel, totalXp },
        quests: {
          completed,
          started,
          notStarted,
          total: QUESTS.length,
          totalPoints,
          earnedPoints,
        },
        collectionLog: { obtained: clogObtained, total: totalClogItems },
        combatAchievements,
        achievementDiaries,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      STATUS.OK,
      CACHE_HEADER,
    );
  })
  // GET /accounts/:username/skills
  .openapi(getSkillsRoute, async (c) => {
    const { username } = c.req.valid("param");
    const db = drizzle(c.env.HYPERDRIVE);

    const account = await getAccountByUsername(db, username);
    if (!account) {
      return c.json(
        { error: "Account not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const skillRows = await db.query.skills.findMany({
      where: eq(skillsTable.accountId, account.id),
      columns: { name: true, xp: true },
    });

    return c.json({ data: formatSkills(skillRows) }, STATUS.OK, CACHE_HEADER);
  })
  // GET /accounts/:username/quests
  .openapi(getQuestsRoute, async (c) => {
    const { username } = c.req.valid("param");
    const db = drizzle(c.env.HYPERDRIVE);

    const account = await getAccountByUsername(db, username);
    if (!account) {
      return c.json(
        { error: "Account not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const questRows = await db.query.quests.findMany({
      where: eq(questsTable.accountId, account.id),
      columns: { id: true, state: true },
    });

    return c.json({ data: formatQuests(questRows) }, STATUS.OK, CACHE_HEADER);
  })
  // GET /accounts/:username/achievement-diaries
  .openapi(getAchievementDiariesRoute, async (c) => {
    const { username } = c.req.valid("param");
    const db = drizzle(c.env.HYPERDRIVE);

    const account = await getAccountByUsername(db, username);
    if (!account) {
      return c.json(
        { error: "Account not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const diaryRows = await db.query.achievementDiaryTiers.findMany({
      where: eq(achievementDiaryTiersTable.accountId, account.id),
      columns: { areaId: true, tier: true, completedCount: true },
    });

    return c.json(
      { data: formatAchievementDiaries(diaryRows) },
      STATUS.OK,
      CACHE_HEADER,
    );
  })
  // GET /accounts/:username/combat-achievements
  .openapi(getCombatAchievementsRoute, async (c) => {
    const { username } = c.req.valid("param");
    const db = drizzle(c.env.HYPERDRIVE);

    const account = await getAccountByUsername(db, username);
    if (!account) {
      return c.json(
        { error: "Account not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const combatRows = await db.query.combatAchievementTiers.findMany({
      where: eq(combatAchievementTiersTable.accountId, account.id),
      columns: { id: true, completedCount: true },
    });

    return c.json(
      { data: formatCombatAchievements(combatRows, account.accountType) },
      STATUS.OK,
      CACHE_HEADER,
    );
  });

// Separate router so it can be mounted last under the Accounts tag
export const fullProfileRouter = createV1App().openapi(
  getFullProfileRoute,
  async (c) => {
    const { username } = c.req.valid("param");
    const db = drizzle(c.env.HYPERDRIVE);

    const account = await getAccountByUsername(db, username);
    if (!account) {
      return c.json(
        { error: "Account not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const [skillRows, questRows, itemRows, diaryRows, combatRows] =
      await Promise.all([
        db.query.skills.findMany({
          where: eq(skillsTable.accountId, account.id),
          columns: { name: true, xp: true },
        }),
        db.query.quests.findMany({
          where: eq(questsTable.accountId, account.id),
          columns: { id: true, state: true },
        }),
        db.query.items.findMany({
          where: eq(items.accountId, account.id),
          columns: { id: true, quantity: true },
        }),
        db.query.achievementDiaryTiers.findMany({
          where: eq(achievementDiaryTiersTable.accountId, account.id),
          columns: { areaId: true, tier: true, completedCount: true },
        }),
        db.query.combatAchievementTiers.findMany({
          where: eq(combatAchievementTiersTable.accountId, account.id),
          columns: { id: true, completedCount: true },
        }),
      ]);

    return c.json(
      {
        username: account.username,
        accountType: formatAccountType(account.accountType),
        clan: formatClan(account),
        groupName: account.groupName,
        skills: formatSkills(skillRows),
        quests: formatQuests(questRows),
        collectionLog: formatCollectionLog(itemRows),
        achievementDiaries: formatAchievementDiaries(diaryRows),
        combatAchievements: formatCombatAchievements(
          combatRows,
          account.accountType,
        ),
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      STATUS.OK,
      CACHE_HEADER,
    );
  },
);
