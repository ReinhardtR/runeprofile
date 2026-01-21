import { count, desc, eq, inArray } from "drizzle-orm";

import { Database, accounts, activities, lower } from "@runeprofile/db";
import { AccountTypes, ActivityEvent } from "@runeprofile/runescape";

import { PaginationParams, getPaginationValues } from "~/lib/helpers";

export async function getGroupActivities(
  db: Database,
  groupName: string,
  filters?: PaginationParams,
) {
  const { page, pageSize, offset } = getPaginationValues(filters);

  // First, get all account IDs in the group
  const groupAccounts = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(lower(accounts.groupName), groupName.toLowerCase()));

  if (groupAccounts.length === 0) {
    return {
      page,
      pageSize,
      total: 0,
      activities: [],
    };
  }

  const accountIds = groupAccounts.map((a) => a.id);

  const activitiesQuery = db
    .select({
      id: activities.id,
      type: activities.type,
      data: activities.data,
      createdAt: activities.createdAt,
      username: accounts.username,
      accountType: accounts.accountType,
      clanName: accounts.clanName,
      clanRank: accounts.clanRank,
      clanIcon: accounts.clanIcon,
    })
    .from(activities)
    .innerJoin(accounts, eq(activities.accountId, accounts.id))
    .where(inArray(activities.accountId, accountIds))
    .orderBy(desc(activities.createdAt), desc(activities.id))
    .limit(pageSize)
    .offset(offset);

  const totalCountQuery = db
    .select({ count: count(activities.id) })
    .from(activities)
    .where(inArray(activities.accountId, accountIds));

  const [activitiesList, totalCountResult] = await Promise.all([
    activitiesQuery,
    totalCountQuery,
  ]);

  const total = totalCountResult[0]?.count ?? 0;

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
        clanName: activity.clanName,
        clanRank: activity.clanRank,
        clanIcon: activity.clanIcon,
      },
    };
  });

  return {
    page,
    pageSize,
    total,
    activities: formattedActivities,
  };
}
