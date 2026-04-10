-- AlterTable
ALTER TABLE `chat_messages`
  ADD COLUMN `attachmentMeta` JSON NULL,
  ADD COLUMN `attachmentUrl` VARCHAR(512) NULL,
  ADD COLUMN `clientMessageId` VARCHAR(191) NULL,
  ADD COLUMN `contentType` ENUM('TEXT', 'IMAGE', 'VOICE') NOT NULL DEFAULT 'TEXT',
  ADD COLUMN `recallReason` VARCHAR(255) NULL,
  ADD COLUMN `recalledAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `chat_message_receipts` (
  `id` VARCHAR(191) NOT NULL,
  `messageId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `deliveredAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `chat_message_receipts_userId_readAt_createdAt_idx`(`userId`, `readAt`, `createdAt`),
  UNIQUE INDEX `chat_message_receipts_messageId_userId_key`(`messageId`, `userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `block_relations` (
  `id` VARCHAR(191) NOT NULL,
  `blockerId` VARCHAR(191) NOT NULL,
  `blockedId` VARCHAR(191) NOT NULL,
  `reason` VARCHAR(255) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `block_relations_blockerId_createdAt_idx`(`blockerId`, `createdAt`),
  INDEX `block_relations_blockedId_createdAt_idx`(`blockedId`, `createdAt`),
  UNIQUE INDEX `block_relations_blockerId_blockedId_key`(`blockerId`, `blockedId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_reports` (
  `id` VARCHAR(191) NOT NULL,
  `reporterId` VARCHAR(191) NOT NULL,
  `reportedUserId` VARCHAR(191) NULL,
  `messageId` VARCHAR(191) NULL,
  `matchId` VARCHAR(191) NULL,
  `category` ENUM('SEXUAL', 'HARASSMENT', 'FRAUD', 'INFRINGEMENT', 'OTHER') NOT NULL,
  `description` TEXT NULL,
  `evidenceUrls` JSON NULL,
  `status` ENUM('PENDING', 'REVIEWED', 'ACTIONED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `reviewerNote` TEXT NULL,
  `callbackSentAt` DATETIME(3) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `ipAddress` VARCHAR(64) NULL,
  `deviceFingerprint` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `user_reports_reporterId_createdAt_idx`(`reporterId`, `createdAt`),
  INDEX `user_reports_reportedUserId_createdAt_idx`(`reportedUserId`, `createdAt`),
  INDEX `user_reports_status_createdAt_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_queue_entries` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `matchId` VARCHAR(191) NULL,
  `matchedUserId` VARCHAR(191) NULL,
  `dedupeKey` VARCHAR(191) NOT NULL,
  `gameName` VARCHAR(191) NOT NULL,
  `gender` VARCHAR(32) NULL,
  `ageMin` INTEGER NULL,
  `ageMax` INTEGER NULL,
  `interests` JSON NULL,
  `region` VARCHAR(64) NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `priorityScore` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('QUEUED', 'MATCHED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'QUEUED',
  `expiresAt` DATETIME(3) NOT NULL,
  `matchedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `match_queue_entries_dedupeKey_key`(`dedupeKey`),
  INDEX `match_queue_entries_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
  INDEX `match_queue_entries_gameName_status_priorityScore_createdAt_idx`(`gameName`, `status`, `priorityScore`, `createdAt`),
  INDEX `match_queue_entries_status_expiresAt_idx`(`status`, `expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_logs` (
  `id` VARCHAR(191) NOT NULL,
  `queueEntryId` VARCHAR(191) NULL,
  `userId` VARCHAR(191) NOT NULL,
  `matchedUserId` VARCHAR(191) NOT NULL,
  `gameName` VARCHAR(191) NOT NULL,
  `score` DOUBLE NOT NULL,
  `filters` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `match_logs_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `match_logs_matchedUserId_createdAt_idx`(`matchedUserId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_events` (
  `id` VARCHAR(191) NOT NULL,
  `actorUserId` VARCHAR(191) NULL,
  `targetUserId` VARCHAR(191) NULL,
  `eventType` ENUM('FRIEND_REQUESTED', 'FRIEND_ACCEPTED', 'FRIEND_REMOVED', 'MESSAGE_SENT', 'MESSAGE_READ', 'MESSAGE_RECALLED', 'USER_BLOCKED', 'USER_UNBLOCKED', 'USER_REPORTED', 'MATCH_ENQUEUED', 'MATCH_FOUND', 'MATCH_CANCELLED', 'EMPTY_STATE_EXPOSED', 'EMPTY_STATE_CLICKED') NOT NULL,
  `ipAddress` VARCHAR(64) NULL,
  `deviceFingerprint` VARCHAR(191) NULL,
  `payload` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `audit_events_actorUserId_createdAt_idx`(`actorUserId`, `createdAt`),
  INDEX `audit_events_targetUserId_createdAt_idx`(`targetUserId`, `createdAt`),
  INDEX `audit_events_eventType_createdAt_idx`(`eventType`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `chat_messages_clientMessageId_key` ON `chat_messages`(`clientMessageId`);

-- CreateIndex
CREATE INDEX `chat_messages_receiverId_recalledAt_createdAt_idx` ON `chat_messages`(`receiverId`, `recalledAt`, `createdAt`);

-- AddForeignKey
ALTER TABLE `chat_message_receipts` ADD CONSTRAINT `chat_message_receipts_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `chat_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_message_receipts` ADD CONSTRAINT `chat_message_receipts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `block_relations` ADD CONSTRAINT `block_relations_blockerId_fkey` FOREIGN KEY (`blockerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `block_relations` ADD CONSTRAINT `block_relations_blockedId_fkey` FOREIGN KEY (`blockedId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_reportedUserId_fkey` FOREIGN KEY (`reportedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `chat_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_queue_entries` ADD CONSTRAINT `match_queue_entries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_queue_entries` ADD CONSTRAINT `match_queue_entries_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_queue_entries` ADD CONSTRAINT `match_queue_entries_matchedUserId_fkey` FOREIGN KEY (`matchedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_logs` ADD CONSTRAINT `match_logs_queueEntryId_fkey` FOREIGN KEY (`queueEntryId`) REFERENCES `match_queue_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_logs` ADD CONSTRAINT `match_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_logs` ADD CONSTRAINT `match_logs_matchedUserId_fkey` FOREIGN KEY (`matchedUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
