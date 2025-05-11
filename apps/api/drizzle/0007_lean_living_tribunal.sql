CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`type` text NOT NULL,
	`data` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activities_account_id_index` ON `activities` (`account_id`);--> statement-breakpoint
CREATE INDEX `activities_account_id_created_at_index` ON `activities` (`account_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `activities_account_id_type_created_at_index` ON `activities` (`account_id`,`type`,`created_at`);--> statement-breakpoint
DROP INDEX `username_unique_index`;--> statement-breakpoint
DROP INDEX `clan_name_index`;--> statement-breakpoint
DROP INDEX `clan_members_sorted_index`;--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_username_unique_index` ON `accounts` (lower("username"));--> statement-breakpoint
CREATE INDEX `accounts_clan_name_index` ON `accounts` (lower("clan_name"));--> statement-breakpoint
CREATE INDEX `accounts_clan_members_sorted_index` ON `accounts` (lower("clan_name"),`clan_rank`,lower("username"));--> statement-breakpoint
CREATE INDEX `achievement_diary_tiers_account_id_index` ON `achievement_diary_tiers` (`account_id`);--> statement-breakpoint
CREATE INDEX `combat_achievement_tiers_account_id_index` ON `combat_achievement_tiers` (`account_id`);--> statement-breakpoint
CREATE INDEX `items_account_id_index` ON `items` (`account_id`);--> statement-breakpoint
CREATE INDEX `quests_account_id_index` ON `quests` (`account_id`);--> statement-breakpoint
CREATE INDEX `skills_account_id_index` ON `skills` (`account_id`);