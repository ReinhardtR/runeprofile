import { and, eq } from "drizzle-orm";

import { Database, activities } from "@runeprofile/db";

import { RuneProfileActivityNotFoundError } from "~/lib/errors";

export async function deleteActivity(
  db: Database,
  input: {
    accountId: string;
    activityId: string;
  },
) {
  // clanActivities rows are removed by the ON DELETE CASCADE foreign key
  const deleted = await db
    .delete(activities)
    .where(
      and(
        eq(activities.id, input.activityId),
        eq(activities.accountId, input.accountId),
      ),
    )
    .returning({ id: activities.id });

  if (deleted.length === 0) {
    throw RuneProfileActivityNotFoundError;
  }
}
