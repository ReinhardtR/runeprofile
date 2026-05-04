import { createRoute, z } from "@hono/zod-openapi";
import { and, eq, inArray } from "drizzle-orm";

import { accounts, items, lower } from "@runeprofile/db";
import { drizzle } from "@runeprofile/db";
import {
  COLLECTION_LOG_ITEMS,
  COLLECTION_LOG_ITEM_IDS,
  COLLECTION_LOG_TABS,
} from "@runeprofile/runescape";

import { STATUS } from "~/lib/status";

import { createV1App } from "../app";
import {
  CollectionLogPageResponseSchema,
  CollectionLogResponseSchema,
  CollectionLogTabResponseSchema,
} from "../schemas/collection-log";
import {
  BadRequestResponse,
  ErrorSchema,
  InternalErrorResponse,
  RateLimitResponse,
  UsernameParam,
} from "../schemas/shared";
import { CACHE_HEADER } from "../shared";

const TabParam = z
  .string()
  .min(1)
  .openapi({
    param: { name: "tab", in: "path" },
    example: "Bosses",
    description:
      "The collection log tab name (e.g. Bosses, Raids, Clues, Minigames, Other)",
  });

const PageParam = z
  .string()
  .min(1)
  .openapi({
    param: { name: "page", in: "path" },
    example: "Abyssal Sire",
    description:
      "The collection log page name within a tab (e.g. Abyssal Sire, Barrows Chests)",
  });

const getCollectionLogRoute = createRoute({
  method: "get",
  path: "/accounts/{username}/collection-log",
  tags: ["Accounts"],
  summary: "Collection log",
  description: "Returns the full collection log organized by tabs and pages.",
  request: {
    params: z.object({ username: UsernameParam }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: CollectionLogResponseSchema } },
      description: "Collection log data",
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

export const collectionLogRouter = createV1App().openapi(
  getCollectionLogRoute,
  async (c) => {
    const { username } = c.req.valid("param");
    const db = drizzle(c.env.HYPERDRIVE);

    const itemMap = await fetchAccountItems(db, username);
    if (!itemMap) {
      return c.json(
        { error: "Account not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    // Top-level counts use the flat unique item list (items can appear on multiple pages)
    const totalItems = COLLECTION_LOG_ITEM_IDS.length;
    const totalObtained = COLLECTION_LOG_ITEM_IDS.filter(
      (id) => (itemMap.get(id) ?? 0) > 0,
    ).length;

    const tabs = COLLECTION_LOG_TABS.map((tab) => {
      const pages = tab.pages.map((page) => buildPage(page, itemMap));
      const tabObtained = pages.reduce((sum, p) => sum + p.obtained, 0);
      const tabTotal = pages.reduce((sum, p) => sum + p.total, 0);

      return {
        name: tab.name,
        obtained: tabObtained,
        total: tabTotal,
        pages,
      };
    });

    return c.json(
      {
        obtained: totalObtained,
        total: totalItems,
        tabs,
      },
      STATUS.OK,
      CACHE_HEADER,
    );
  },
);

// --- Get a specific tab ---

const getCollectionLogTabRoute = createRoute({
  method: "get",
  path: "/accounts/{username}/collection-log/{tab}",
  tags: ["Accounts"],
  summary: "Collection log tab",
  description: "Returns a single collection log tab and its pages.",
  request: {
    params: z.object({ username: UsernameParam, tab: TabParam }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: CollectionLogTabResponseSchema },
      },
      description: "Collection log tab data",
    },
    400: BadRequestResponse,
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Account or tab not found",
    },
    429: RateLimitResponse,
    500: InternalErrorResponse,
  },
});

// --- Get a specific page ---

const getCollectionLogPageRoute = createRoute({
  method: "get",
  path: "/accounts/{username}/collection-log/{tab}/{page}",
  tags: ["Accounts"],
  summary: "Collection log page",
  description: "Returns a single collection log page.",
  request: {
    params: z.object({
      username: UsernameParam,
      tab: TabParam,
      page: PageParam,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: CollectionLogPageResponseSchema },
      },
      description: "Collection log page data",
    },
    400: BadRequestResponse,
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Account, tab, or page not found",
    },
    429: RateLimitResponse,
    500: InternalErrorResponse,
  },
});

function buildPage(
  page: { name: string; items: number[] },
  itemMap: Map<number, number>,
) {
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
}

async function fetchAccountItems(
  db: ReturnType<typeof drizzle>,
  username: string,
  itemIds?: number[],
) {
  const account = await db.query.accounts.findFirst({
    where: eq(lower(accounts.username), username.toLowerCase()),
    columns: { id: true },
  });
  if (!account) return null;

  const where =
    itemIds && itemIds.length > 0
      ? and(eq(items.accountId, account.id), inArray(items.id, itemIds))
      : eq(items.accountId, account.id);

  const itemRows = await db.query.items.findMany({
    where,
    columns: { id: true, quantity: true },
  });
  return new Map(itemRows.map((i) => [i.id, i.quantity]));
}

export const collectionLogTabRouter = createV1App().openapi(
  getCollectionLogTabRoute,
  async (c) => {
    const { username, tab: tabName } = c.req.valid("param");
    const db = drizzle(c.env.HYPERDRIVE);

    const tab = COLLECTION_LOG_TABS.find(
      (t) => t.name.toLowerCase() === tabName.toLowerCase(),
    );
    if (!tab) {
      return c.json(
        { error: "Tab not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const tabItemIds = tab.pages.flatMap((p) => p.items);
    const itemMap = await fetchAccountItems(db, username, tabItemIds);
    if (!itemMap) {
      return c.json(
        { error: "Account not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const pages = tab.pages.map((page) => buildPage(page, itemMap));
    const tabObtained = pages.reduce((sum, p) => sum + p.obtained, 0);
    const tabTotal = pages.reduce((sum, p) => sum + p.total, 0);

    return c.json(
      {
        name: tab.name,
        obtained: tabObtained,
        total: tabTotal,
        pages,
      },
      STATUS.OK,
      CACHE_HEADER,
    );
  },
);

export const collectionLogPageRouter = createV1App().openapi(
  getCollectionLogPageRoute,
  async (c) => {
    const { username, tab: tabName, page: pageName } = c.req.valid("param");
    const db = drizzle(c.env.HYPERDRIVE);

    const tab = COLLECTION_LOG_TABS.find(
      (t) => t.name.toLowerCase() === tabName.toLowerCase(),
    );
    if (!tab) {
      return c.json(
        { error: "Tab not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const page = tab.pages.find(
      (p) => p.name.toLowerCase() === pageName.toLowerCase(),
    );
    if (!page) {
      return c.json(
        { error: "Page not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const itemMap = await fetchAccountItems(db, username, page.items);
    if (!itemMap) {
      return c.json(
        { error: "Account not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    return c.json(buildPage(page, itemMap), STATUS.OK, CACHE_HEADER);
  },
);
