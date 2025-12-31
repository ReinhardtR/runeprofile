import { InferInsertModel } from "drizzle-orm";

import { Database, activities, withValues } from "@runeprofile/db";
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

  await withValues(activitiesValues, (v) => db.insert(activities).values(v));
}
