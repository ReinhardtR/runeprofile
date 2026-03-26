ALTER TABLE "clan_activities" DROP CONSTRAINT "clan_activities_activity_id_activities_id_fk";
--> statement-breakpoint
DROP INDEX "clan_activities_name_created_at_id_desc_index";--> statement-breakpoint
ALTER TABLE "clan_activities" ADD CONSTRAINT "clan_activities_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clan_activities_name_created_at_id_desc_index" ON "clan_activities" USING btree ("clan_name","created_at" DESC NULLS LAST,"activity_id" DESC NULLS LAST);