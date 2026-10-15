-- Created on production ahead of this migration (CONCURRENTLY, Oct 2026, for
-- the event leaderboards), so it's guarded to no-op there; fresh databases
-- get the index.
CREATE INDEX IF NOT EXISTS "items_id_index" ON "items" USING btree ("id");
