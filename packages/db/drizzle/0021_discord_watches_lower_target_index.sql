-- Created on production ahead of this migration (CONCURRENTLY, Nov 2026,
-- PlanetScale schema recommendation #18), so it's guarded to no-op there;
-- fresh databases get the index.
CREATE INDEX IF NOT EXISTS "discord_watches_target_type_lower_target_id_index" ON "discord_watches" USING btree ("target_type",lower("target_id"));
