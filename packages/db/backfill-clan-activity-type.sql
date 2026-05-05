-- Backfill clan_activities.activity_type from activities.type
-- Run this AFTER deploying the new code (which writes activity_type on insert).
-- Execute repeatedly until 0 rows are updated.
-- Batches of 10,000 to avoid long row locks on a live database.

UPDATE "clan_activities"
SET "activity_type" = "activities"."type"
FROM "activities"
WHERE "clan_activities"."activity_id" = "activities"."id"
  AND "clan_activities"."activity_type" IS NULL
  AND "clan_activities"."activity_id" IN (
    SELECT "activity_id" FROM "clan_activities"
    WHERE "activity_type" IS NULL
    LIMIT 10000
  );

-- Verify backfill is complete:
-- SELECT COUNT(*) FROM "clan_activities" WHERE "activity_type" IS NULL;

-- Once the above returns 0, apply the NOT NULL constraint:
-- ALTER TABLE "clan_activities" ALTER COLUMN "activity_type" SET NOT NULL;
-- Then update the schema to .notNull() and regenerate.
