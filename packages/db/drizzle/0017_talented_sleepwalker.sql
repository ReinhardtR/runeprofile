-- These changes were applied to production ahead of this migration (indexes
-- created/dropped CONCURRENTLY during the Sept 2026 DB CPU fixes), so every
-- statement is guarded to no-op there; fresh databases get the full effect.
DROP INDEX IF EXISTS "accounts_clan_name_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "activities_account_id_created_at_id_desc_index";--> statement-breakpoint
DROP INDEX IF EXISTS "clan_activities_name_created_at_id_desc_index";--> statement-breakpoint
DROP INDEX IF EXISTS "clan_activities_name_type_created_at_id_desc_index";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_username_pattern_index" ON "accounts" USING btree (lower("username") text_pattern_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_clan_name_pattern_index" ON "accounts" USING btree (lower("clan_name") text_pattern_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clan_activities_name_created_at_id_index" ON "clan_activities" USING btree ("clan_name","created_at","activity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clan_activities_name_type_created_at_id_index" ON "clan_activities" USING btree ("clan_name","activity_type","created_at","activity_id");
