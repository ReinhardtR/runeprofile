CREATE TABLE "discord_watch_filters" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"mode" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "discord_watch_filters_channel_activity_unique_index" ON "discord_watch_filters" USING btree ("channel_id","activity_type");--> statement-breakpoint
CREATE INDEX "discord_watch_filters_channel_index" ON "discord_watch_filters" USING btree ("channel_id");