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

  // One ordered index scan per member, merged. `account_id in (...)` can't use
  // activities_account_id_created_at_id_index for the sort, so it would read
  // the group's whole history to return a page.
  const recent = db
    .select({
      id: activities.id,
      type: activities.type,
      data: activities.data,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .where(eq(activities.accountId, accounts.id))
    .orderBy(desc(activities.createdAt), desc(activities.id))
    .limit(offset + pageSize)
    .as("recent");

  const activitiesQuery = db
    .select({
      id: recent.id,
      type: recent.type,
      data: recent.data,
      createdAt: recent.createdAt,
      username: accounts.username,
      accountType: accounts.accountType,
      clanName: accounts.clanName,
      clanRank: accounts.clanRank,
      clanIcon: accounts.clanIcon,
    })
    .from(accounts)
    .crossJoinLateral(recent)
    .where(inArray(accounts.id, accountIds))
    .orderBy(desc(recent.createdAt), desc(recent.id))
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
