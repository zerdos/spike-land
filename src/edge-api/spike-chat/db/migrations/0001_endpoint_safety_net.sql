-- BUG-S6-08 / BUG-S6-19: defensive `IF NOT EXISTS` re-declarations of the tables
-- backing the six previously-stub spike-chat endpoints (read-cursors, bookmarks,
-- threads/replies, pins, presence, reactions). These tables are already created
-- by 0000_rare_landau.sql; this migration is idempotent and simply ensures the
-- schema exists on freshly-provisioned D1 instances where the original migration
-- may not have been applied yet.

CREATE TABLE IF NOT EXISTS `read_cursors` (
  `userId` text NOT NULL,
  `channelId` text NOT NULL,
  `lastReadMessageId` text NOT NULL,
  `updatedAt` integer NOT NULL,
  PRIMARY KEY(`userId`, `channelId`)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL,
  `messageId` text NOT NULL,
  `note` text,
  `createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `bookmarks_user_id_idx` ON `bookmarks` (`userId`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `bookmarks_userId_messageId_unique` ON `bookmarks` (`userId`,`messageId`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `pins` (
  `id` text PRIMARY KEY NOT NULL,
  `channelId` text NOT NULL,
  `messageId` text NOT NULL,
  `pinnedBy` text NOT NULL,
  `createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `pins_channelId_messageId_unique` ON `pins` (`channelId`,`messageId`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `reactions` (
  `id` text PRIMARY KEY NOT NULL,
  `messageId` text NOT NULL,
  `userId` text NOT NULL,
  `emoji` text NOT NULL,
  `createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `reactions_message_id_idx` ON `reactions` (`messageId`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `reactions_messageId_userId_emoji_unique` ON `reactions` (`messageId`,`userId`,`emoji`);
--> statement-breakpoint

-- threads are stored in `messages` via the `threadId` column + `replyCount` on
-- the parent row; both are already declared in 0000_rare_landau.sql. No
-- additional schema needed here, but we restate the index for safety.
CREATE INDEX IF NOT EXISTS `messages_thread_id_idx` ON `messages` (`threadId`);
--> statement-breakpoint

-- presence is held in PRESENCE_DO in-memory storage with a TTL alarm; no
-- D1 table is required for the live state. (Audit-style historical presence
-- can be added later as a separate migration.)
