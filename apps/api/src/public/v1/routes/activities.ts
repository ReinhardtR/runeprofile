import { createRoute, z } from "@hono/zod-openapi";
import { SQL, and, asc, desc, eq, sql } from "drizzle-orm";

import { accounts, activities, lower } from "@runeprofile/db";
import { drizzle } from "@runeprofile/db";
import { AccountTypes, type ActivityEvent } from "@runeprofile/runescape";

import { decodeCursor, encodeCursor } from "~/lib/helpers";
import { STATUS } from "~/lib/status";

import { createV1App } from "../app";
import { ActivitiesResponseSchema, type Activity } from "../schemas/activities";
import {
  BadRequestResponse,
  CursorQuery,
  DirectionQuery,
  ErrorSchema,
  InternalErrorResponse,
  RateLimitResponse,
  UsernameParam,
} from "../schemas/shared";
import { CACHE_HEADER, enrichActivity } from "../shared";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

const LimitQuery = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_LIMIT)
  .optional()
  .default(DEFAULT_LIMIT)
  .openapi({
    param: { name: "limit", in: "query" },
    description: `Number of items per page (max ${MAX_LIMIT})`,
  });

const getActivitiesRoute = createRoute({
  method: "get",
  path: "/accounts/{username}/activities",
  tags: ["Accounts"],
  summary: "Activity feed",
  description: "Returns a paginated feed of recent account activities.",
  request: {
    params: z.object({ username: UsernameParam }),
    query: z.object({
      cursor: CursorQuery,
      direction: DirectionQuery,
      limit: LimitQuery,
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: ActivitiesResponseSchema } },
      description: "Activity feed",
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

export const activitiesRouter = createV1App().openapi(
  getActivitiesRoute,
  async (c) => {
    const { username } = c.req.valid("param");
    const { cursor: cursorStr, direction, limit } = c.req.valid("query");
    const db = drizzle(c.env.HYPERDRIVE);

    const account = await db.query.accounts.findFirst({
      where: eq(lower(accounts.username), username.toLowerCase()),
      columns: { id: true },
    });

    if (!account) {
      return c.json(
        { error: "Account not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const cursor = decodeCursor(cursorStr);
    const fetchLimit = limit + 1;
    const accountCondition = eq(activities.accountId, account.id);

    let cursorCondition: SQL | undefined;
    if (cursor && cursor.createdAt && cursor.id) {
      if (direction === "next") {
        cursorCondition = sql`(${activities.createdAt}, ${activities.id}) < (${cursor.createdAt}, ${cursor.id})`;
      } else {
        cursorCondition = sql`(${activities.createdAt}, ${activities.id}) > (${cursor.createdAt}, ${cursor.id})`;
      }
    }

    const whereCondition = cursorCondition
      ? and(accountCondition, cursorCondition)
      : accountCondition;

    let rows = await db
      .select({
        id: activities.id,
        type: activities.type,
        data: activities.data,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .where(whereCondition)
      .orderBy(
        direction === "prev"
          ? asc(activities.createdAt)
          : desc(activities.createdAt),
        direction === "prev" ? asc(activities.id) : desc(activities.id),
      )
      .limit(fetchLimit);

    if (direction === "prev") {
      rows = rows.reverse();
    }

    const hasMoreInDirection = rows.length > limit;
    if (hasMoreInDirection) {
      rows = rows.slice(0, limit);
    }

    const firstItem = rows[0];
    const lastItem = rows[rows.length - 1];

    const hasPrev =
      direction === "next" ? cursor !== undefined : hasMoreInDirection;
    const hasMore =
      direction === "next" ? hasMoreInDirection : cursor !== undefined;

    const nextCursor =
      hasMore && lastItem
        ? encodeCursor({ createdAt: lastItem.createdAt, id: lastItem.id })
        : null;

    const prevCursor =
      hasPrev && firstItem
        ? encodeCursor({ createdAt: firstItem.createdAt, id: firstItem.id })
        : null;

    const formattedActivities = rows.map((row) => {
      const event = { type: row.type, data: row.data } as ActivityEvent;
      return {
        type: row.type,
        data: row.data,
        enriched: enrichActivity(event),
        createdAt: row.createdAt,
      } as Activity;
    });

    return c.json(
      {
        activities: formattedActivities,
        nextCursor,
        prevCursor,
        hasMore,
        hasPrev,
      },
      STATUS.OK,
      CACHE_HEADER,
    );
  },
);
