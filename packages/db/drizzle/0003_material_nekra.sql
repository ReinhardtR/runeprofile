DROP INDEX "activities_account_id_created_at_index";--> statement-breakpoint
CREATE INDEX "accounts_clan_name_id_index" ON "accounts" USING btree (lower("clan_name"),"id");--> statement-breakpoint
CREATE INDEX "activities_account_id_created_at_id_desc_index" ON "activities" USING btree ("account_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_account_id_created_at_id_index" ON "activities" USING btree ("account_id","created_at","id");