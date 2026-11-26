CREATE TABLE `ultra_auth_credentials` (
	`userId` int NOT NULL,
	`emailNormalized` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ultra_auth_credentials_userId` PRIMARY KEY(`userId`),
	CONSTRAINT `ultra_auth_credentials_email_uq` UNIQUE(`emailNormalized`)
);
--> statement-breakpoint
CREATE TABLE `ultra_auth_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`csrfToken` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ultra_auth_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ultra_auth_sessions_token_hash_uq` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `ultra_auth_credentials` ADD CONSTRAINT `ultra_auth_credentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ultra_auth_sessions` ADD CONSTRAINT `ultra_auth_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ultra_auth_sessions_user_id_idx` ON `ultra_auth_sessions` (`userId`);