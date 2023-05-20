-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migraitons
/*
CREATE TABLE `Account` (
	`accountHash` varchar(40) PRIMARY KEY NOT NULL,
	`username` varchar(12) NOT NULL,
	`accountType` enum('NORMAL','IRONMAN','HARDCORE_IRONMAN','ULTIMATE_IRONMAN','GROUP_IRONMAN','HARDCORE_GROUP_IRONMAN','UNRANKED_GROUP_IRONMAN') NOT NULL,
	`isPrivate` tinyint NOT NULL DEFAULT 0,
	`generatedPath` varchar(16),
	`modelUri` varchar(191),
	`description` varchar(191) NOT NULL DEFAULT '',
	`combatLevel` int NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL);

CREATE TABLE `AchievementDiary` (
	`area` varchar(191) NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`area`)
);

CREATE TABLE `AchievementDiaryTier` (
	`tier` enum('EASY','MEDIUM','HARD','ELITE') NOT NULL,
	`completed` int NOT NULL,
	`total` int NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`area` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`area`,`tier`)
);

CREATE TABLE `CollectionLog` (
	`uniqueItemsObtained` int NOT NULL,
	`uniqueItemsTotal` int NOT NULL,
	`accountHash` varchar(191) PRIMARY KEY NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL);

CREATE TABLE `CombatAchievementTier` (
	`tier` enum('EASY','MEDIUM','HARD','ELITE','MASTER','GRANDMASTER') NOT NULL,
	`completed` int NOT NULL,
	`total` int NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`tier`)
);

CREATE TABLE `CombatAchievements` (
	`accountHash` varchar(191) PRIMARY KEY NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)));

CREATE TABLE `Entry` (
	`index` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`tabName` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`name`,`tabName`)
);

CREATE TABLE `HiscoresActivity` (
	`index` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`rank` int NOT NULL,
	`score` int NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`leaderboardType` enum('NORMAL','IRONMAN','HARDCORE','ULTIMATE') NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`leaderboardType`,`name`)
);

CREATE TABLE `HiscoresBoss` (
	`index` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`rank` int NOT NULL,
	`kills` int NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`leaderboardType` enum('NORMAL','IRONMAN','HARDCORE','ULTIMATE') NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`leaderboardType`,`name`)
);

CREATE TABLE `HiscoresLeaderboard` (
	`type` enum('NORMAL','IRONMAN','HARDCORE','ULTIMATE') NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	PRIMARY KEY(`accountHash`,`type`)
);

CREATE TABLE `HiscoresSkill` (
	`index` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`rank` int NOT NULL,
	`level` int NOT NULL,
	`xp` int NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`leaderboardType` enum('NORMAL','IRONMAN','HARDCORE','ULTIMATE') NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`leaderboardType`,`name`)
);

CREATE TABLE `Item` (
	`index` int NOT NULL,
	`id` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`quantity` int NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`tabName` varchar(191) NOT NULL,
	`entryName` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`entryName`,`id`,`tabName`)
);

CREATE TABLE `KillCount` (
	`index` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`count` int NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`tabName` varchar(191) NOT NULL,
	`entryName` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`entryName`,`name`,`tabName`)
);

CREATE TABLE `ObtainedAt` (
	`date` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`accountHash` varchar(191) NOT NULL,
	`tabName` varchar(191) NOT NULL,
	`entryName` varchar(191) NOT NULL,
	`itemId` int NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	PRIMARY KEY(`accountHash`,`entryName`,`itemId`,`tabName`)
);

CREATE TABLE `ObtainedAtKillCount` (
	`index` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`count` int NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`tabName` varchar(191) NOT NULL,
	`entryName` varchar(191) NOT NULL,
	`itemId` int NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	PRIMARY KEY(`accountHash`,`entryName`,`itemId`,`name`,`tabName`)
);

CREATE TABLE `Quest` (
	`index` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`state` enum('NOT_STARTED','IN_PROGRESS','FINISHED') NOT NULL,
	`type` enum('F2P','P2P','MINI','UNKNOWN') NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`name`)
);

CREATE TABLE `QuestList` (
	`points` int NOT NULL,
	`accountHash` varchar(191) PRIMARY KEY NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL);

CREATE TABLE `Skill` (
	`index` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`xp` int NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`name`)
);

CREATE TABLE `Tab` (
	`index` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`accountHash` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	PRIMARY KEY(`accountHash`,`name`)
);

CREATE UNIQUE INDEX `Account_username_key` ON `Account` (`username`);
CREATE UNIQUE INDEX `Account_generatedPath_key` ON `Account` (`generatedPath`);
CREATE INDEX `AchievementDiary_accountHash_idx` ON `AchievementDiary` (`accountHash`);
CREATE INDEX `AchievementDiaryTier_accountHash_area_idx` ON `AchievementDiaryTier` (`accountHash`,`area`);
CREATE INDEX `CollectionLog_accountHash_idx` ON `CollectionLog` (`accountHash`);
CREATE INDEX `CombatAchievementTier_accountHash_idx` ON `CombatAchievementTier` (`accountHash`);
CREATE INDEX `CombatAchievements_accountHash_idx` ON `CombatAchievements` (`accountHash`);
CREATE INDEX `Entry_accountHash_tabName_idx` ON `Entry` (`accountHash`,`tabName`);
CREATE INDEX `HiscoresActivity_accountHash_leaderboardType_idx` ON `HiscoresActivity` (`accountHash`,`leaderboardType`);
CREATE INDEX `HiscoresBoss_accountHash_leaderboardType_idx` ON `HiscoresBoss` (`accountHash`,`leaderboardType`);
CREATE INDEX `HiscoresLeaderboard_accountHash_idx` ON `HiscoresLeaderboard` (`accountHash`);
CREATE INDEX `HiscoresSkill_accountHash_leaderboardType_idx` ON `HiscoresSkill` (`accountHash`,`leaderboardType`);
CREATE INDEX `Item_accountHash_tabName_entryName_idx` ON `Item` (`accountHash`,`tabName`,`entryName`);
CREATE INDEX `KillCount_accountHash_tabName_entryName_idx` ON `KillCount` (`accountHash`,`tabName`,`entryName`);
CREATE INDEX `ObtainedAt_accountHash_tabName_entryName_itemId_idx` ON `ObtainedAt` (`accountHash`,`tabName`,`entryName`,`itemId`);
CREATE INDEX `ObtainedAtKillCount_accountHash_tabName_entryName_itemId_idx` ON `ObtainedAtKillCount` (`accountHash`,`tabName`,`entryName`,`itemId`);
CREATE INDEX `Quest_accountHash_idx` ON `Quest` (`accountHash`);
CREATE INDEX `QuestList_accountHash_idx` ON `QuestList` (`accountHash`);
CREATE INDEX `Skill_accountHash_idx` ON `Skill` (`accountHash`);
CREATE INDEX `Tab_accountHash_idx` ON `Tab` (`accountHash`);
*/