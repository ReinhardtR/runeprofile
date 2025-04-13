CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`account_type` integer NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `username_unique_index` ON `accounts` (lower("username"));--> statement-breakpoint
CREATE TABLE `achievement_diary_tiers` (
	`account_id` text NOT NULL,
	`area_id` integer NOT NULL,
	`tier` integer NOT NULL,
	`completed_count` integer NOT NULL,
	PRIMARY KEY(`account_id`, `area_id`, `tier`),
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `combat_achievement_tiers` (
	`account_id` text NOT NULL,
	`id` integer NOT NULL,
	`completed_count` integer NOT NULL,
	PRIMARY KEY(`account_id`, `id`),
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `items` (
	`account_id` text NOT NULL,
	`id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`account_id`, `id`),
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`account_id` text NOT NULL,
	`id` integer NOT NULL,
	`state` integer NOT NULL,
	PRIMARY KEY(`account_id`, `id`),
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`account_id` text NOT NULL,
	`name` text NOT NULL,
	`xp` integer NOT NULL,
	PRIMARY KEY(`account_id`, `name`),
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
