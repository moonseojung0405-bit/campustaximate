CREATE TABLE `members` (
	`ride_id` text NOT NULL,
	`user_id` text NOT NULL,
	`nickname` text NOT NULL,
	`joined` integer NOT NULL,
	PRIMARY KEY(`ride_id`, `user_id`),
	FOREIGN KEY (`ride_id`) REFERENCES `rides`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_members_user` ON `members` (`user_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`ride_id` text NOT NULL,
	`user_id` text NOT NULL,
	`nickname` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`ride_id`) REFERENCES `rides`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_messages_ride_created` ON `messages` (`ride_id`,`created`);--> statement-breakpoint
CREATE TABLE `rides` (
	`id` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`station` text NOT NULL,
	`departure` integer NOT NULL,
	`place` text NOT NULL,
	`capacity` integer NOT NULL,
	`fare` integer,
	`note` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rides_station_departure` ON `rides` (`station`,`departure`);--> statement-breakpoint
CREATE INDEX `idx_rides_host_created` ON `rides` (`host`,`created`);