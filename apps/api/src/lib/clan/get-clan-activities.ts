import { SQL, and, asc, desc, eq, sql } from "drizzle-orm";

import {
  Database,
  accounts,
  activities,
  clanActivities,
} from "@runeprofile/db";
import { AccountTypes, ActivityEvent } from "@runeprofile/runescape";

import {
  CursorPaginationParams,
  encodeCursor,
  getCursorPaginationValues,
} from "~/lib/helpers";

export async function getClanActivities(
  db: Database,
  clanName: string,
  filters?: CursorPaginationParams,
) {
  const { cursor, direction, limit } = getCursorPaginationValues(filters);

  // Fetch limit + 1 to determine if there are more results
  const fetchLimit = limit + 1;

  const clanCondition = eq(clanActivities.clanName, clanName.toLowerCase());

  // Add cursor condition based on direction
  let cursorCondition: SQL | undefined;
  if (cursor && cursor.createdAt && cursor.id) {
    const cursorDate = cursor.createdAt;
    if (direction === "next") {
      // For descending order: fetch items BEFORE cursor (older items)
      cursorCondition = sql`(${clanActivities.createdAt}, ${clanActivities.activityId}) < (${cursorDate}, ${cursor.id})`;
    } else {
      // For prev: fetch items AFTER cursor (newer items)
      cursorCondition = sql`(${clanActivities.createdAt}, ${clanActivities.activityId}) > (${cursorDate}, ${cursor.id})`;
    }
  }

  const whereCondition = cursorCondition
    ? and(clanCondition, cursorCondition)
    : clanCondition;

  // Query with appropriate ordering
  const query = db
    .select({
      activityId: clanActivities.activityId,
      clanActivityCreatedAt: clanActivities.createdAt,
      id: activities.id,
      type: activities.type,
      data: activities.data,
      createdAt: activities.createdAt,
      username: accounts.username,
      accountType: accounts.accountType,
      clanRank: accounts.clanRank,
      clanIcon: accounts.clanIcon,
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

  let activitiesList = await query;

  // If going backwards, reverse the results to maintain desc order
  if (direction === "prev") {
    activitiesList = activitiesList.reverse();
  }

  // Determine if there are more results in the current query direction
  const hasMoreInDirection = activitiesList.length > limit;
  if (hasMoreInDirection) {
    activitiesList = activitiesList.slice(0, limit);
  }

  // Determine cursors
  const firstItem = activitiesList[0];
  const lastItem = activitiesList[activitiesList.length - 1];

  const hasPrev =
    direction === "next" ? cursor !== undefined : hasMoreInDirection;
  const hasMore =
    direction === "next" ? hasMoreInDirection : cursor !== undefined;

  const nextCursor =
    hasMore && lastItem
      ? encodeCursor({
          createdAt: lastItem.createdAt,
          id: lastItem.id,
        })
      : null;

  const prevCursor =
    hasPrev && firstItem
      ? encodeCursor({
          createdAt: firstItem.createdAt,
          id: firstItem.id,
        })
      : null;

  const formattedActivities = activitiesList.map((activity) => {
    const accountType =
      AccountTypes.find((type) => type.id === activity.accountType) ||
      AccountTypes[0];

    const activityData = {
      type: activity.type,
      data: activity.data,
    } as ActivityEvent;

    return {
      id: activity.id,
      createdAt: activity.createdAt,
      ...activityData,
      account: {
        username: activity.username,
        accountType,
        clanRank: activity.clanRank,
        clanIcon: activity.clanIcon,
      },
    };
  });

  return {
    activities: formattedActivities,
    nextCursor,
    prevCursor,
    hasMore,
    hasPrev,
  };
}
