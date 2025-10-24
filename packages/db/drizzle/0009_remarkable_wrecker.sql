CREATE TABLE `discord_users` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`rsn` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `discord_users_account_id_index` ON `discord_users` (`account_id`);--> statement-breakpoint
CREATE INDEX `discord_users_rsn_index` ON `discord_users` (`rsn`);--> statement-breakpoint
CREATE TABLE `discord_watches` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discord_watches_channel_target_unique_index` ON `discord_watches` (`channel_id`,`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `discord_watches_channel_index` ON `discord_watches` (`channel_id`);--> statement-breakpoint
CREATE INDEX `discord_watches_target_index` ON `discord_watches` (`target_type`,`target_id`);