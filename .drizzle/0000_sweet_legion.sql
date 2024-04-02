CREATE TABLE `acc_achievement_diaries` (
	`account_hash` text(40) NOT NULL,
	`diary_id` integer NOT NULL,
	`tasks_completed` integer NOT NULL,
	PRIMARY KEY(`account_hash`, `diary_id`),
	FOREIGN KEY (`account_hash`) REFERENCES `accounts`(`account_hash`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`diary_id`) REFERENCES `achievement_diaries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `acc_clog_item_obtained_kcs` (
	`account_hash` text(40) NOT NULL,
	`item_id` integer NOT NULL,
	`kc_id` integer NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`account_hash`, `item_id`, `kc_id`),
	FOREIGN KEY (`account_hash`) REFERENCES `accounts`(`account_hash`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `clog_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`kc_id`) REFERENCES `clog_kcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `acc_clog_items` (
	`account_hash` text(40) NOT NULL,
	`item_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`obtained_at` integer,
	PRIMARY KEY(`account_hash`, `item_id`),
	FOREIGN KEY (`account_hash`) REFERENCES `accounts`(`account_hash`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `clog_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `acc_clog_kcs` (
	`account_hash` text(40) NOT NULL,
	`kc_id` integer NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`account_hash`, `kc_id`),
	FOREIGN KEY (`account_hash`) REFERENCES `accounts`(`account_hash`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`kc_id`) REFERENCES `clog_kcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `acc_ca_tiers` (
	`account_hash` text(40) NOT NULL,
	`tier_id` integer NOT NULL,
	`tasks_completed` integer NOT NULL,
	PRIMARY KEY(`account_hash`, `tier_id`),
	FOREIGN KEY (`account_hash`) REFERENCES `accounts`(`account_hash`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tier_id`) REFERENCES `combat_achievement_tiers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `acc_hiscores_entries` (
	`account_hash` text(40) NOT NULL,
	`entry_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`score` integer NOT NULL,
	PRIMARY KEY(`account_hash`, `entry_id`),
	FOREIGN KEY (`account_hash`) REFERENCES `accounts`(`account_hash`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entry_id`) REFERENCES `hiscores_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `acc_quests` (
	`account_hash` text(40) NOT NULL,
	`quest_id` integer NOT NULL,
	`state` text NOT NULL,
	PRIMARY KEY(`account_hash`, `quest_id`),
	FOREIGN KEY (`account_hash`) REFERENCES `accounts`(`account_hash`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `acc_skills` (
	`account_hash` text(40) NOT NULL,
	`skill_id` integer NOT NULL,
	`xp` integer NOT NULL,
	PRIMARY KEY(`account_hash`, `skill_id`),
	FOREIGN KEY (`account_hash`) REFERENCES `accounts`(`account_hash`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`account_hash` text(40) PRIMARY KEY NOT NULL,
	`account_type` text NOT NULL,
	`username` text(12) NOT NULL,
	`generated_url_path` text(16),
	`model_uri` text(255),
	`description` text(255),
	`quest_points` integer NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`is_banned` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `achievement_diaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`area` text(255) NOT NULL,
	`tier` text(255) NOT NULL,
	`tasks_total` integer NOT NULL,
	`meta_approved` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clog_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`meta_approved` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clog_kcs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text(255) NOT NULL,
	`meta_approved` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clog_pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tab` text(255) NOT NULL,
	`name` text(255) NOT NULL,
	`order_idx` integer NOT NULL,
	`meta_approved` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clog_pages_items` (
	`page_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`order_idx` integer NOT NULL,
	`meta_approved` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`item_id`, `page_id`),
	FOREIGN KEY (`page_id`) REFERENCES `clog_pages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `clog_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clog_pages_kcs` (
	`page_id` integer NOT NULL,
	`kc_id` integer NOT NULL,
	`order_idx` integer NOT NULL,
	`meta_approved` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`kc_id`, `page_id`),
	FOREIGN KEY (`page_id`) REFERENCES `clog_pages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`kc_id`) REFERENCES `clog_kcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `combat_achievement_tiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`combat_achievement_tier` text(255) NOT NULL,
	`tasks_total` integer NOT NULL,
	`meta_approved` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hiscores_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_mode` text(255) NOT NULL,
	`activity` text(255) NOT NULL,
	`order_idx` integer NOT NULL,
	`meta_approved` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`type` text NOT NULL,
	`order_idx` integer NOT NULL,
	`meta_approved` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`order_idx` integer NOT NULL,
	`meta_approved` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_username_unique` ON `accounts` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_generated_url_path_unique` ON `accounts` (`generated_url_path`);--> statement-breakpoint
CREATE UNIQUE INDEX `area_tier` ON `achievement_diaries` (`area`,`tier`);--> statement-breakpoint
CREATE UNIQUE INDEX `clog_kcs_label_unique` ON `clog_kcs` (`label`);--> statement-breakpoint
CREATE UNIQUE INDEX `clog_pages_name_unique` ON `clog_pages` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `combat_achievement_tiers_combat_achievement_tier_unique` ON `combat_achievement_tiers` (`combat_achievement_tier`);--> statement-breakpoint
CREATE UNIQUE INDEX `game_mode_activity_unique_idx` ON `hiscores_entries` (`game_mode`,`activity`);--> statement-breakpoint
CREATE UNIQUE INDEX `quests_name_unique` ON `quests` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `skills_name_unique` ON `skills` (`name`);