import { SQL, and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { Database, activities } from "@runeprofile/db";
import { ActivityEventTypeSchema } from "@runeprofile/runescape";

import { RuneProfileInvalidCursorError } from "~/lib/errors";
import { decodeCursor, encodeCursor } from "~/lib/helpers";

export async function getActivities(
  db: Database,
  input: {
    accountId: string;
    activityTypes?: Array<z.infer<typeof ActivityEventTypeSchema>>;
    limit: number;
    cursor?: string;
  },
) {
  let cursor: ReturnType<typeof decodeCursor>;
  try {
    cursor = decodeCursor(input.cursor);
  } catch {
    throw RuneProfileInvalidCursorError;
  }

  const conditions: SQL[] = [eq(activities.accountId, input.accountId)];

  if (input.activityTypes && input.activityTypes.length > 0) {
    conditions.push(inArray(activities.type, input.activityTypes));
  }

  if (cursor && cursor.createdAt && cursor.id) {
    conditions.push(
      sql`(${activities.createdAt}, ${activities.id}) < (${cursor.createdAt}, ${cursor.id})`,
    );
  }

  const fetchLimit = input.limit + 1;

  let rows = await db
    .select({
      id: activities.id,
      type: activities.type,
      data: activities.data,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.createdAt), desc(activities.id))
    .limit(fetchLimit);

  const hasMore = rows.length > input.limit;
  if (hasMore) {
    rows = rows.slice(0, input.limit);
  }

  const lastItem = rows[rows.length - 1];
  const nextCursor =
    hasMore && lastItem
      ? encodeCursor({ createdAt: lastItem.createdAt, id: lastItem.id })
      : null;

  return {
    activities: rows,
    nextCursor,
    hasMore,
  };
}
