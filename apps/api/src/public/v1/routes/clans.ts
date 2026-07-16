import { createRoute, z } from "@hono/zod-openapi";
import {
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { accounts, activities, clanActivities, lower } from "@runeprofile/db";
import { drizzle } from "@runeprofile/db";
import {
  AccountTypes,
  type ActivityEvent,
  ActivityEventTypeSchema,
  type ActivityEventTypeValue,
} from "@runeprofile/runescape";

import { decodeCursor, encodeCursor } from "~/lib/helpers";
import { STATUS } from "~/lib/status";

import { createV1App } from "../app";
import {
  ClanActivitiesResponseSchema,
  type ClanActivity,
} from "../schemas/activities";
import { ClanResponseSchema } from "../schemas/clans";
import {
  BadRequestResponse,
  ClanNameParam,
  CursorQuery,
  DirectionQuery,
  ErrorSchema,
  FromQuery,
  InternalErrorResponse,
  RateLimitResponse,
  ToQuery,
} from "../schemas/shared";
import { CACHE_HEADER, enrichActivity } from "../shared";

const MAX_MEMBERS_LIMIT = 100;
const DEFAULT_MEMBERS_LIMIT = 50;
const MAX_ACTIVITIES_LIMIT = 50;
const DEFAULT_ACTIVITIES_LIMIT = 20;

const MembersLimitQuery = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_MEMBERS_LIMIT)
  .optional()
  .default(DEFAULT_MEMBERS_LIMIT)
  .openapi({
    param: { name: "limit", in: "query" },
    description: `Number of members per page (max ${MAX_MEMBERS_LIMIT})`,
  });

const ActivitiesLimitQuery = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_ACTIVITIES_LIMIT)
  .optional()
  .default(DEFAULT_ACTIVITIES_LIMIT)
  .openapi({
    param: { name: "limit", in: "query" },
    description: `Number of activities per page (max ${MAX_ACTIVITIES_LIMIT})`,
  });

const ActivityTypesQuery = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    const types = val
      .split(",")
      .filter(
        (t): t is ActivityEventTypeValue =>
          ActivityEventTypeSchema.safeParse(t).success,
      );
    return types.length > 0 ? types : undefined;
  })
  .openapi({
    param: {
      name: "activityTypes",
      in: "query",
      style: "form",
      explode: false,
    },
    description: "Comma-separated list of activity types to filter by.",
    type: "array",
    items: {
      type: "string",
      enum: ActivityEventTypeSchema.options,
    },
  });

// --- Route: GET /clans/:name ---
const getClanRoute = createRoute({
  method: "get",
  path: "/clans/{name}",
  tags: ["Clans"],
  summary: "Information",
  description: "Returns clan details and a paginated member list.",
  request: {
    params: z.object({ name: ClanNameParam }),
    query: z.object({
      cursor: CursorQuery,
      direction: DirectionQuery,
      limit: MembersLimitQuery,
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: ClanResponseSchema } },
      description: "Clan information",
    },
    400: BadRequestResponse,
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Clan not found",
    },
    429: RateLimitResponse,
    500: InternalErrorResponse,
  },
});

// --- Route: GET /clans/:name/activities ---
const getClanActivitiesRoute = createRoute({
  method: "get",
  path: "/clans/{name}/activities",
  tags: ["Clans"],
  summary: "Activity feed",
  description: "Returns a paginated feed of recent clan activities.",
  request: {
    params: z.object({ name: ClanNameParam }),
    query: z.object({
      cursor: CursorQuery,
      direction: DirectionQuery,
      limit: ActivitiesLimitQuery,
      activityTypes: ActivityTypesQuery,
      from: FromQuery,
      to: ToQuery,
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: ClanActivitiesResponseSchema } },
      description: "Clan activity feed",
    },
    400: BadRequestResponse,
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Clan not found",
    },
    429: RateLimitResponse,
    500: InternalErrorResponse,
  },
});

// --- Register routes ---
export const clansRouter = createV1App()
  // GET /clans/:name
  .openapi(getClanRoute, async (c) => {
    const { name } = c.req.valid("param");
    const { cursor: cursorStr, direction, limit } = c.req.valid("query");
    const db = drizzle(c.env.HYPERDRIVE);

    const cursor = decodeCursor(cursorStr);
    const fetchLimit = limit + 1;
    const clanCondition = eq(lower(accounts.clanName), name.toLowerCase());

    let cursorCondition: SQL | undefined;
    if (cursor && cursor.clanRank !== undefined && cursor.username) {
      const cursorUsername = cursor.username.toLowerCase();
      const cursorRank = parseInt(cursor.clanRank, 10);

      if (direction === "next") {
        cursorCondition = or(
          lt(accounts.clanRank, cursorRank),
          and(
            eq(accounts.clanRank, cursorRank),
            gt(lower(accounts.username), cursorUsername),
          ),
        );
      } else {
        cursorCondition = or(
          gt(accounts.clanRank, cursorRank),
          and(
            eq(accounts.clanRank, cursorRank),
            lt(lower(accounts.username), cursorUsername),
          ),
        );
      }
    }

    const whereCondition = cursorCondition
      ? and(clanCondition, cursorCondition)
      : clanCondition;

    const [fetchedMembers, totalResult] = await Promise.all([
      db
        .select({
          accountType: accounts.accountType,
          username: accounts.username,
          clanName: accounts.clanName,
          clanRank: accounts.clanRank,
          clanIcon: accounts.clanIcon,
          clanTitle: accounts.clanTitle,
        })
        .from(accounts)
        .where(whereCondition)
        .orderBy(
          direction === "prev"
            ? asc(accounts.clanRank)
            : desc(accounts.clanRank),
          direction === "prev"
            ? desc(lower(accounts.username))
            : asc(lower(accounts.username)),
        )
        .limit(fetchLimit),
      db
        .select({ count: count(accounts.username) })
        .from(accounts)
        .where(clanCondition),
    ]);

    const total = totalResult[0]?.count ?? 0;

    if (total === 0) {
      return c.json(
        { error: "Clan not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    let members =
      direction === "prev" ? fetchedMembers.reverse() : fetchedMembers;
    const hasMoreInDirection = members.length > limit;
    if (hasMoreInDirection) {
      members = members.slice(0, limit);
    }

    const firstItem = members[0];
    const lastItem = members[members.length - 1];

    const hasPrev =
      direction === "next" ? cursor !== undefined : hasMoreInDirection;
    const hasMore =
      direction === "next" ? hasMoreInDirection : cursor !== undefined;

    const nextCursor =
      hasMore && lastItem
        ? encodeCursor({
            clanRank: String(lastItem.clanRank!),
            username: lastItem.username,
          })
        : null;

    const prevCursor =
      hasPrev && firstItem
        ? encodeCursor({
            clanRank: String(firstItem.clanRank!),
            username: firstItem.username,
          })
        : null;

    // Use the first member's clan name for the canonical name
    const clanName = members.find((m) => m.clanName)?.clanName ?? name;

    const formattedMembers = members
      .filter(
        (m) =>
          !!m.clanName &&
          m.clanRank !== null &&
          m.clanIcon !== null &&
          !!m.clanTitle,
      )
      .map((m) => ({
        username: m.username,
        accountType:
          AccountTypes.find((t) => t.id === m.accountType) ?? AccountTypes[0],
        clan: {
          rank: m.clanRank!,
          icon: m.clanIcon!,
          title: m.clanTitle!,
        },
      }));

    return c.json(
      {
        name: clanName,
        total,
        members: formattedMembers,
        nextCursor,
        prevCursor,
        hasMore,
        hasPrev,
      },
      STATUS.OK,
      CACHE_HEADER,
    );
  })
  // GET /clans/:name/activities
  .openapi(getClanActivitiesRoute, async (c) => {
    const { name } = c.req.valid("param");
    const {
      cursor: cursorStr,
      direction,
      limit,
      activityTypes,
      from,
      to,
    } = c.req.valid("query");
    const db = drizzle(c.env.HYPERDRIVE);

    // Verify clan exists
    const clanExists = await db
      .select({ count: count(accounts.username) })
      .from(accounts)
      .where(eq(lower(accounts.clanName), name.toLowerCase()));

    if ((clanExists[0]?.count ?? 0) === 0) {
      return c.json(
        { error: "Clan not found", code: "NOT_FOUND" },
        STATUS.NOT_FOUND,
      );
    }

    const cursor = decodeCursor(cursorStr);
    const fetchLimit = limit + 1;

    const conditions: SQL[] = [eq(clanActivities.clanName, name.toLowerCase())];

    if (activityTypes && activityTypes.length > 0) {
      conditions.push(inArray(clanActivities.activityType, activityTypes));
    }

    if (from) {
      conditions.push(gte(clanActivities.createdAt, from.toISOString()));
    }

    if (to) {
      conditions.push(lte(clanActivities.createdAt, to.toISOString()));
    }

    let cursorCondition: SQL | undefined;
    if (cursor && cursor.createdAt && cursor.id) {
      if (direction === "next") {
        cursorCondition = sql`(${clanActivities.createdAt}, ${clanActivities.activityId}) < (${cursor.createdAt}, ${cursor.id})`;
      } else {
        cursorCondition = sql`(${clanActivities.createdAt}, ${clanActivities.activityId}) > (${cursor.createdAt}, ${cursor.id})`;
      }
    }

    if (cursorCondition) {
      conditions.push(cursorCondition);
    }

    const whereCondition = and(...conditions);

    let rows = await db
      .select({
        activityId: clanActivities.activityId,
        type: activities.type,
        data: activities.data,
        createdAt: activities.createdAt,
        username: accounts.username,
        accountType: accounts.accountType,
      })
      .from(clanActivities)
      .innerJoin(activities, eq(clanActivities.activityId, activities.id))
      .innerJoin(accounts, eq(activities.accountId, accounts.id))
      .where(whereCondition)
      .orderBy(
        direction === "prev"
          ? asc(clanActivities.createdAt)
          : desc(clanActivities.createdAt),
        direction === "prev"
          ? asc(clanActivities.activityId)
          : desc(clanActivities.activityId),
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
        ? encodeCursor({
            createdAt: lastItem.createdAt,
            id: lastItem.activityId,
          })
        : null;

    const prevCursor =
      hasPrev && firstItem
        ? encodeCursor({
            createdAt: firstItem.createdAt,
            id: firstItem.activityId,
          })
        : null;

    const formattedActivities = rows.map((row) => {
      const event = { type: row.type, data: row.data } as ActivityEvent;
      return {
        type: row.type,
        data: row.data,
        enriched: enrichActivity(event),
        createdAt: row.createdAt,
        account: {
          username: row.username,
          accountType:
            AccountTypes.find((t) => t.id === row.accountType) ??
            AccountTypes[0],
        },
      } as ClanActivity;
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
  });
