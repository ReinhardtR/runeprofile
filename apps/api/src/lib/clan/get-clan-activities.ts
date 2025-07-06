import { count, desc, eq } from "drizzle-orm";

import { AccountTypes, ActivityEvent } from "@runeprofile/runescape";

import { Database, accounts, activities } from "~/db";
import { lower } from "~/db/helpers";
import { PaginationParams, getPaginationValues } from "~/lib/helpers";

export async function getClanActivities(
  db: Database,
  clanName: string,
  filters?: PaginationParams,
) {
  const { page, pageSize, offset } = getPaginationValues(filters);

  const activitiesQuery = db
    .select({
      id: activities.id,
      type: activities.type,
      data: activities.data,
      createdAt: activities.createdAt,
      username: accounts.username,
      accountType: accounts.accountType,
      clanRank: accounts.clanRank,
      clanIcon: accounts.clanIcon,
    })
    .from(activities)
    .innerJoin(accounts, eq(activities.accountId, accounts.id))
    .where(eq(lower(accounts.clanName), clanName.toLowerCase()))
    .orderBy(desc(activities.createdAt))
    .limit(pageSize)
    .offset(offset);

  const totalCountQuery = db
    .select({ count: count(activities.id) })
    .from(activities)
    .innerJoin(accounts, eq(activities.accountId, accounts.id))
    .where(eq(lower(accounts.clanName), clanName.toLowerCase()));

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
