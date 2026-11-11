CREATE TABLE "boss_records" (
	"account_id" text PRIMARY KEY NOT NULL,
	"kill_counts" jsonb NOT NULL,
	"personal_bests" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boss_records" ADD CONSTRAINT "boss_records_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;