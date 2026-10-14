CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`task_id` text NOT NULL,
	`kind` text NOT NULL,
	`artefact_id` text,
	`correct` integer NOT NULL,
	`ts` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `events_player_idx` ON `events` (`player_id`);--> statement-breakpoint
CREATE INDEX `events_task_idx` ON `events` (`task_id`,`kind`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`player_id` text PRIMARY KEY NOT NULL,
	`snapshot` text NOT NULL,
	`version` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
