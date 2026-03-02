import { InferInsertModel, eq } from "drizzle-orm";

import {
  Database,
  accounts,
  activities,
  clanActivities,
  withValues,
} from "@runeprofile/db";
import { ActivityEvent } from "@runeprofile/runescape";

export async function addActivities(
  db: Database,
  input: {
    accountId: string;
    activities: Array<ActivityEvent>;
  },
) {
  const activitiesValues: Array<InferInsertModel<typeof activities>> =
    input.activities.map((activity) => ({
      id: crypto.randomUUID(),
      accountId: input.accountId,
      type: activity.type,
      data: activity.data,
    }));

  await db.transaction(async (tx) => {
    const [account] = await tx
      .select({ clanName: accounts.clanName })
      .from(accounts)
      .where(eq(accounts.id, input.accountId))
      .limit(1);

    const clanActivitiesValues: Array<InferInsertModel<typeof clanActivities>> =
      account?.clanName
        ? activitiesValues.map((activity) => ({
            activityId: activity.id,
            clanName: account.clanName?.toLowerCase() ?? "",
          }))
        : [];

    await withValues(activitiesValues, (v) => tx.insert(activities).values(v));
    await withValues(clanActivitiesValues, (v) =>
      tx.insert(clanActivities).values(v),
    );
  });
}
