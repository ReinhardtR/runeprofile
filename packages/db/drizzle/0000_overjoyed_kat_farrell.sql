CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"account_type" integer NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"clan_name" text,
	"clan_rank" integer,
	"clan_icon" integer,
	"clan_title" text,
	"default_clog_page" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievement_diary_tiers" (
	"account_id" text NOT NULL,
	"area_id" integer NOT NULL,
	"tier" integer NOT NULL,
	"completed_count" integer NOT NULL,
	CONSTRAINT "achievement_diary_tiers_account_id_area_id_tier_pk" PRIMARY KEY("account_id","area_id","tier")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"type" text NOT NULL,
	"data" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combat_achievement_tiers" (
	"account_id" text NOT NULL,
	"id" integer NOT NULL,
	"completed_count" integer NOT NULL,
	CONSTRAINT "combat_achievement_tiers_account_id_id_pk" PRIMARY KEY("account_id","id")
);
--> statement-breakpoint
CREATE TABLE "discord_users" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text,
	"rsn" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_watches" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"account_id" text NOT NULL,
	"id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "items_account_id_id_pk" PRIMARY KEY("account_id","id")
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"account_id" text NOT NULL,
	"id" integer NOT NULL,
	"state" integer NOT NULL,
	CONSTRAINT "quests_account_id_id_pk" PRIMARY KEY("account_id","id")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"account_id" text NOT NULL,
	"name" text NOT NULL,
	"xp" integer NOT NULL,
	CONSTRAINT "skills_account_id_name_pk" PRIMARY KEY("account_id","name")
);
--> statement-breakpoint
ALTER TABLE "achievement_diary_tiers" ADD CONSTRAINT "achievement_diary_tiers_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combat_achievement_tiers" ADD CONSTRAINT "combat_achievement_tiers_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_users" ADD CONSTRAINT "discord_users_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_username_unique_index" ON "accounts" USING btree (lower("username"));--> statement-breakpoint
CREATE INDEX "accounts_clan_name_index" ON "accounts" USING btree (lower("clan_name"));--> statement-breakpoint
CREATE INDEX "accounts_clan_members_sorted_index" ON "accounts" USING btree (lower("clan_name"),"clan_rank",lower("username"));--> statement-breakpoint
CREATE INDEX "achievement_diary_tiers_account_id_index" ON "achievement_diary_tiers" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "activities_account_id_index" ON "activities" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "activities_account_id_created_at_index" ON "activities" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "activities_account_id_type_created_at_index" ON "activities" USING btree ("account_id","type","created_at");--> statement-breakpoint
CREATE INDEX "combat_achievement_tiers_account_id_index" ON "combat_achievement_tiers" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "discord_users_account_id_index" ON "discord_users" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "discord_users_rsn_index" ON "discord_users" USING btree ("rsn");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_watches_channel_target_unique_index" ON "discord_watches" USING btree ("channel_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "discord_watches_channel_index" ON "discord_watches" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "discord_watches_target_index" ON "discord_watches" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "items_account_id_index" ON "items" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "quests_account_id_index" ON "quests" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "skills_account_id_index" ON "skills" USING btree ("account_id");