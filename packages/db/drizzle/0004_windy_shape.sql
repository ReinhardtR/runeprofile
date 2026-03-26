CREATE TABLE "clan_activities" (
	"activity_id" text PRIMARY KEY NOT NULL,
	"clan_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clan_activities" ADD CONSTRAINT "clan_activities_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clan_activities_name_created_at_id_desc_index" ON "clan_activities" USING btree (lower("clan_name"),"created_at" DESC NULLS LAST,"activity_id" DESC NULLS LAST);