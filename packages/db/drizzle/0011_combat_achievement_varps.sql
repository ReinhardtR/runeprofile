CREATE TABLE "combat_achievement_varps" (
	"account_id" text PRIMARY KEY NOT NULL,
	"varps" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "combat_achievement_varps" ADD CONSTRAINT "combat_achievement_varps_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;