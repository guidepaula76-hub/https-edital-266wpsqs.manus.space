CREATE TABLE `ultra_study_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`nodeId` int NOT NULL,
	`subject` varchar(140) NOT NULL,
	`topic` varchar(300) NOT NULL,
	`requestId` varchar(36) NOT NULL,
	`value` varchar(10),
	`correct` boolean NOT NULL,
	`blank` boolean NOT NULL,
	`xpAwarded` int NOT NULL DEFAULT 0,
	`nodeCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ultra_study_answers_id` PRIMARY KEY(`id`),
	CONSTRAINT `ultra_study_answers_user_request_uq` UNIQUE(`userId`,`requestId`)
);
--> statement-breakpoint
CREATE TABLE `ultra_study_daily_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`day` varchar(10) NOT NULL,
	`verticalizations` int NOT NULL DEFAULT 0,
	`questionGenerations` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ultra_study_daily_usage_id` PRIMARY KEY(`id`),
	CONSTRAINT `ultra_study_daily_usage_user_day_uq` UNIQUE(`userId`,`day`)
);
--> statement-breakpoint
CREATE TABLE `ultra_study_disciplines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goalId` int NOT NULL,
	`position` int NOT NULL,
	`name` varchar(140) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ultra_study_disciplines_id` PRIMARY KEY(`id`),
	CONSTRAINT `ultra_study_disciplines_goal_position_uq` UNIQUE(`userId`,`goalId`,`position`)
);
--> statement-breakpoint
CREATE TABLE `ultra_study_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`source` enum('text','pdf') NOT NULL,
	`rawText` mediumtext NOT NULL,
	`storageKey` varchar(512),
	`sizeBytes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ultra_study_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ultra_study_error_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`nodeId` int NOT NULL,
	`errorCount` int NOT NULL DEFAULT 1,
	`lastErrorAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ultra_study_error_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `ultra_study_errors_user_question_uq` UNIQUE(`userId`,`questionId`)
);
--> statement-breakpoint
CREATE TABLE `ultra_study_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentId` int,
	`concurso` varchar(180) NOT NULL,
	`cargo` varchar(180) NOT NULL,
	`nivel` enum('Fundamental','Médio','Superior') NOT NULL,
	`banca` varchar(100) NOT NULL,
	`format` enum('CE','AD','AE') NOT NULL,
	`hours` double NOT NULL,
	`examDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ultra_study_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ultra_study_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goalId` int NOT NULL,
	`disciplineId` int NOT NULL,
	`level` int NOT NULL,
	`position` int NOT NULL,
	`topicPosition` int NOT NULL,
	`subject` varchar(140) NOT NULL,
	`topic` varchar(300) NOT NULL,
	`completedAt` timestamp,
	`generationLockId` varchar(36),
	`generationLockExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ultra_study_nodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `ultra_study_nodes_goal_level_position_uq` UNIQUE(`userId`,`goalId`,`level`,`position`),
	CONSTRAINT `ultra_study_nodes_goal_discipline_topic_level_uq` UNIQUE(`userId`,`goalId`,`disciplineId`,`topicPosition`,`level`)
);
--> statement-breakpoint
CREATE TABLE `ultra_study_preferences` (
	`userId` int NOT NULL,
	`activeGoalId` int,
	`sound` boolean NOT NULL DEFAULT false,
	`dailyGoal` int NOT NULL DEFAULT 50,
	`writing` text NOT NULL DEFAULT (''),
	`scheduleRevision` int NOT NULL DEFAULT 0,
	`xp` int NOT NULL DEFAULT 0,
	`streak` int NOT NULL DEFAULT 0,
	`lastStudyDay` varchar(10) NOT NULL DEFAULT '',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ultra_study_preferences_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `ultra_study_question_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ultra_study_question_rewards_id` PRIMARY KEY(`id`),
	CONSTRAINT `ultra_study_question_rewards_user_question_uq` UNIQUE(`userId`,`questionId`)
);
--> statement-breakpoint
CREATE TABLE `ultra_study_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goalId` int NOT NULL,
	`nodeId` int NOT NULL,
	`subject` varchar(140) NOT NULL,
	`topic` varchar(300) NOT NULL,
	`board` varchar(100) NOT NULL,
	`format` enum('CE','AD','AE') NOT NULL,
	`level` int NOT NULL,
	`difficulty` enum('Fácil','Médio','Difícil') NOT NULL,
	`prompt` text NOT NULL,
	`promptHash` varchar(64) NOT NULL,
	`choices` json NOT NULL,
	`correctAnswer` varchar(10) NOT NULL,
	`explanation` text NOT NULL,
	`trap` text NOT NULL,
	`rationales` json NOT NULL,
	`source` enum('ai','sample') NOT NULL DEFAULT 'ai',
	`generationId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ultra_study_questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ultra_study_questions_user_node_prompt_hash_uq` UNIQUE(`userId`,`nodeId`,`promptHash`),
	CONSTRAINT `ultra_study_questions_user_generation_order_uq` UNIQUE(`userId`,`generationId`,`id`)
);
--> statement-breakpoint
ALTER TABLE `ultra_study_answers` ADD CONSTRAINT `ultra_study_answers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_answers` ADD CONSTRAINT `ultra_study_answers_questionId_ultra_study_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `ultra_study_questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_answers` ADD CONSTRAINT `ultra_study_answers_nodeId_ultra_study_nodes_id_fk` FOREIGN KEY (`nodeId`) REFERENCES `ultra_study_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_daily_usage` ADD CONSTRAINT `ultra_study_daily_usage_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_disciplines` ADD CONSTRAINT `ultra_study_disciplines_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_disciplines` ADD CONSTRAINT `ultra_study_disciplines_goalId_ultra_study_goals_id_fk` FOREIGN KEY (`goalId`) REFERENCES `ultra_study_goals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_documents` ADD CONSTRAINT `ultra_study_documents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_error_entries` ADD CONSTRAINT `ultra_study_error_entries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_error_entries` ADD CONSTRAINT `ultra_study_error_entries_questionId_ultra_study_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `ultra_study_questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_error_entries` ADD CONSTRAINT `ultra_study_error_entries_nodeId_ultra_study_nodes_id_fk` FOREIGN KEY (`nodeId`) REFERENCES `ultra_study_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_goals` ADD CONSTRAINT `ultra_study_goals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_goals` ADD CONSTRAINT `ultra_study_goals_documentId_ultra_study_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `ultra_study_documents`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_nodes` ADD CONSTRAINT `ultra_study_nodes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_nodes` ADD CONSTRAINT `ultra_study_nodes_goalId_ultra_study_goals_id_fk` FOREIGN KEY (`goalId`) REFERENCES `ultra_study_goals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_nodes` ADD CONSTRAINT `ultra_study_nodes_disciplineId_ultra_study_disciplines_id_fk` FOREIGN KEY (`disciplineId`) REFERENCES `ultra_study_disciplines`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_preferences` ADD CONSTRAINT `ultra_study_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_preferences` ADD CONSTRAINT `ultra_study_preferences_activeGoalId_ultra_study_goals_id_fk` FOREIGN KEY (`activeGoalId`) REFERENCES `ultra_study_goals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_question_rewards` ADD CONSTRAINT `ultra_study_question_rewards_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_question_rewards` ADD CONSTRAINT `ultra_study_question_rewards_questionId_ultra_study_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `ultra_study_questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_questions` ADD CONSTRAINT `ultra_study_questions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_questions` ADD CONSTRAINT `ultra_study_questions_goalId_ultra_study_goals_id_fk` FOREIGN KEY (`goalId`) REFERENCES `ultra_study_goals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_study_questions` ADD CONSTRAINT `ultra_study_questions_nodeId_ultra_study_nodes_id_fk` FOREIGN KEY (`nodeId`) REFERENCES `ultra_study_nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ultra_study_answers_user_node_idx` ON `ultra_study_answers` (`userId`,`nodeId`);--> statement-breakpoint
CREATE INDEX `ultra_study_answers_user_question_idx` ON `ultra_study_answers` (`userId`,`questionId`);--> statement-breakpoint
CREATE INDEX `ultra_study_disciplines_goal_idx` ON `ultra_study_disciplines` (`userId`,`goalId`);--> statement-breakpoint
CREATE INDEX `ultra_study_documents_user_created_idx` ON `ultra_study_documents` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ultra_study_errors_user_pending_idx` ON `ultra_study_error_entries` (`userId`,`resolvedAt`,`lastErrorAt`);--> statement-breakpoint
CREATE INDEX `ultra_study_goals_user_created_idx` ON `ultra_study_goals` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ultra_study_nodes_goal_idx` ON `ultra_study_nodes` (`userId`,`goalId`,`level`,`position`);--> statement-breakpoint
CREATE INDEX `ultra_study_questions_node_idx` ON `ultra_study_questions` (`userId`,`nodeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ultra_study_questions_goal_idx` ON `ultra_study_questions` (`userId`,`goalId`);