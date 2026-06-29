ALTER TABLE "discord_watch_filters" ALTER COLUMN "mode" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "discord_watch_filters" ADD COLUMN "threshold" integer;