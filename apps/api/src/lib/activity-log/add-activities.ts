import { InferInsertModel } from "drizzle-orm";

import { Database, activities, autochunk } from "@runeprofile/database";
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

  await Promise.all([
    ...autochunk({ items: activitiesValues }, (chunk) =>
      db.insert(activities).values(chunk),
    ),
  ]);
}
