CREATE INDEX `clan_name_index` ON `accounts` (lower("clan_name"));--> statement-breakpoint
CREATE INDEX `clan_members_sorted_index` ON `accounts` (lower("clan_name"),`clan_rank`,lower("username"));