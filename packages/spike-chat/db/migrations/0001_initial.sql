-- spike-chat initial D1 schema
--
-- Idempotent variant of `src/edge-api/spike-chat/db/migrations/0000_rare_landau.sql`
-- (drizzle-generated). Uses `IF NOT EXISTS` so this can be applied safely on a
-- fresh DB or on top of an already-provisioned one.
--
-- Source of truth for the schema is the drizzle definition at:
--   src/edge-api/spike-chat/db/schema.ts
-- Regenerate the drizzle migration with `drizzle-kit generate` from that
-- directory. This file mirrors that schema for the deploy-shim wrangler.toml.
--
-- Tables included (BUG-S6-08 endpoints depend on these):
--   - channels, channel_members, messages
--   - read_cursors, bookmarks, pins, reactions  (S6-08 stub endpoints)
--   - webhooks, agent_profiles, slash_commands

CREATE TABLE IF NOT EXISTS `channels` (
  `id` text PRIMARY KEY NOT NULL,
  `workspaceId` text NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `type` text NOT NULL,
  `createdBy` text NOT NULL,
  `isArchived` integer DEFAULT 0 NOT NULL,
  `metadata` text,
  `createdAt` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `channels_workspace_id_idx` ON `channels` (`workspaceId`);

CREATE TABLE IF NOT EXISTS `channel_members` (
  `channelId` text NOT NULL,
  `userId` text NOT NULL,
  `role` text DEFAULT 'member' NOT NULL,
  `isMuted` integer DEFAULT 0 NOT NULL,
  `notifyPreference` text DEFAULT 'all' NOT NULL,
  `joined_at` integer NOT NULL,
  PRIMARY KEY(`channelId`, `userId`),
  FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `messages` (
  `id` text PRIMARY KEY NOT NULL,
  `channelId` text NOT NULL,
  `userId` text NOT NULL,
  `threadId` text,
  `content` text NOT NULL,
  `contentType` text DEFAULT 'text' NOT NULL,
  `editedAt` integer,
  `deletedAt` integer,
  `replyCount` integer DEFAULT 0 NOT NULL,
  `reactionSummary` text,
  `createdAt` integer NOT NULL,
  FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX IF NOT EXISTS `messages_channel_id_idx` ON `messages` (`channelId`);
CREATE INDEX IF NOT EXISTS `messages_thread_id_idx` ON `messages` (`threadId`);
CREATE INDEX IF NOT EXISTS `messages_user_id_idx` ON `messages` (`userId`);

CREATE TABLE IF NOT EXISTS `read_cursors` (
  `userId` text NOT NULL,
  `channelId` text NOT NULL,
  `lastReadMessageId` text NOT NULL,
  `updatedAt` integer NOT NULL,
  PRIMARY KEY(`userId`, `channelId`),
  FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL,
  `messageId` text NOT NULL,
  `note` text,
  `createdAt` integer NOT NULL,
  FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX IF NOT EXISTS `bookmarks_user_id_idx` ON `bookmarks` (`userId`);
CREATE UNIQUE INDEX IF NOT EXISTS `bookmarks_userId_messageId_unique` ON `bookmarks` (`userId`, `messageId`);

CREATE TABLE IF NOT EXISTS `pins` (
  `id` text PRIMARY KEY NOT NULL,
  `channelId` text NOT NULL,
  `messageId` text NOT NULL,
  `pinnedBy` text NOT NULL,
  `createdAt` integer NOT NULL,
  FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX IF NOT EXISTS `pins_channelId_messageId_unique` ON `pins` (`channelId`, `messageId`);

CREATE TABLE IF NOT EXISTS `reactions` (
  `id` text PRIMARY KEY NOT NULL,
  `messageId` text NOT NULL,
  `userId` text NOT NULL,
  `emoji` text NOT NULL,
  `createdAt` integer NOT NULL,
  FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX IF NOT EXISTS `reactions_message_id_idx` ON `reactions` (`messageId`);
CREATE UNIQUE INDEX IF NOT EXISTS `reactions_messageId_userId_emoji_unique` ON `reactions` (`messageId`, `userId`, `emoji`);

CREATE TABLE IF NOT EXISTS `webhooks` (
  `id` text PRIMARY KEY NOT NULL,
  `workspaceId` text NOT NULL,
  `channelId` text NOT NULL,
  `type` text NOT NULL,
  `url` text,
  `token` text NOT NULL,
  `createdAt` integer NOT NULL,
  FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX IF NOT EXISTS `webhooks_workspace_id_idx` ON `webhooks` (`workspaceId`);

CREATE TABLE IF NOT EXISTS `agent_profiles` (
  `id` text PRIMARY KEY NOT NULL,
  `workspaceId` text NOT NULL,
  `displayName` text NOT NULL,
  `capabilities` text,
  `createdAt` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `slash_commands` (
  `id` text PRIMARY KEY NOT NULL,
  `workspaceId` text NOT NULL,
  `command` text NOT NULL,
  `handlerUrl` text,
  `handlerAgentId` text,
  `createdAt` integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `slash_commands_workspaceId_command_unique` ON `slash_commands` (`workspaceId`, `command`);

-- Presence is currently held in the PRESENCE_DO Durable Object, not D1.
-- If a persistent presence audit log is added later, create the `presence` table here.
