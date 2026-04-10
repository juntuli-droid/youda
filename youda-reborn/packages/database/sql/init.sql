CREATE DATABASE IF NOT EXISTS youda_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE youda_prod;

CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(32) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(512) NULL,
    `personalityCode` VARCHAR(32) NULL,
    `badges` JSON NULL,
    `unlockedBadges` JSON NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_publicId_key`(`publicId`),
    INDEX `users_publicId_idx`(`publicId`),
    INDEX `users_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `friends` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `friendId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'BLOCKED') NOT NULL DEFAULT 'PENDING',
    `messageRetentionPolicy` VARCHAR(32) NOT NULL DEFAULT 'PRESERVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `friends_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
    INDEX `friends_friendId_status_createdAt_idx`(`friendId`, `status`, `createdAt`),
    UNIQUE INDEX `friends_userId_friendId_key`(`userId`, `friendId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `matches` (
    `id` VARCHAR(191) NOT NULL,
    `hostUserId` VARCHAR(191) NOT NULL,
    `gameName` VARCHAR(191) NOT NULL,
    `personality` VARCHAR(64) NULL,
    `duration` VARCHAR(64) NULL,
    `roomCode` VARCHAR(64) NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'ENDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `matches_roomCode_key`(`roomCode`),
    INDEX `matches_hostUserId_createdAt_idx`(`hostUserId`, `createdAt`),
    INDEX `matches_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `voice_room_participants` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `peerId` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(512) NULL,
    `deviceFingerprint` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leftAt` DATETIME(3) NULL,

    UNIQUE INDEX `voice_room_participants_peerId_key`(`peerId`),
    UNIQUE INDEX `voice_room_participants_matchId_userId_key`(`matchId`, `userId`),
    INDEX `voice_room_participants_matchId_lastSeenAt_idx`(`matchId`, `lastSeenAt`),
    INDEX `voice_room_participants_matchId_leftAt_lastSeenAt_idx`(`matchId`, `leftAt`, `lastSeenAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `voice_room_signals` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `senderPeerId` VARCHAR(191) NOT NULL,
    `targetUserId` VARCHAR(191) NULL,
    `targetPeerId` VARCHAR(191) NULL,
    `signalType` ENUM('JOIN', 'OFFER', 'ANSWER', 'ICE', 'LEAVE') NOT NULL,
    `payload` JSON NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `voice_room_signals_matchId_createdAt_idx`(`matchId`, `createdAt`),
    INDEX `voice_room_signals_matchId_targetPeerId_createdAt_idx`(`matchId`, `targetPeerId`, `createdAt`),
    INDEX `voice_room_signals_matchId_expiresAt_idx`(`matchId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NULL,
    `clientMessageId` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `messageType` ENUM('DIRECT', 'MATCH', 'SYSTEM') NOT NULL DEFAULT 'DIRECT',
    `contentType` ENUM('TEXT', 'IMAGE', 'VOICE') NOT NULL DEFAULT 'TEXT',
    `attachmentUrl` VARCHAR(512) NULL,
    `attachmentMeta` JSON NULL,
    `recalledAt` DATETIME(3) NULL,
    `recallReason` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `chat_messages_clientMessageId_key`(`clientMessageId`),
    INDEX `chat_messages_senderId_createdAt_idx`(`senderId`, `createdAt`),
    INDEX `chat_messages_matchId_createdAt_idx`(`matchId`, `createdAt`),
    INDEX `chat_messages_receiverId_createdAt_idx`(`receiverId`, `createdAt`),
    INDEX `chat_messages_senderId_receiverId_createdAt_idx`(`senderId`, `receiverId`, `createdAt`),
    INDEX `chat_messages_receiverId_recalledAt_createdAt_idx`(`receiverId`, `recalledAt`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `vlogs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `gameName` VARCHAR(191) NOT NULL,
    `videoUrl` VARCHAR(512) NULL,
    `coverUrl` VARCHAR(512) NULL,
    `content` TEXT NULL,
    `type` ENUM('VIDEO', 'LOG') NOT NULL DEFAULT 'VIDEO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vlogs_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `vlogs_gameName_createdAt_idx`(`gameName`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `careers` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `gameName` VARCHAR(191) NOT NULL,
    `hours` INTEGER NOT NULL DEFAULT 0,
    `rank` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `careers_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `careers_gameName_createdAt_idx`(`gameName`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `lastUsedAt` DATETIME(3) NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(512) NULL,
    `deviceFingerprint` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `refresh_tokens_tokenHash_key`(`tokenHash`),
    INDEX `refresh_tokens_userId_expiresAt_idx`(`userId`, `expiresAt`),
    INDEX `refresh_tokens_userId_revokedAt_idx`(`userId`, `revokedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_tokenHash_key`(`tokenHash`),
    INDEX `password_reset_tokens_userId_expiresAt_idx`(`userId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `login_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `refreshTokenId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(512) NULL,
    `deviceFingerprint` VARCHAR(191) NOT NULL,
    `verificationState` VARCHAR(32) NOT NULL DEFAULT 'TRUSTED',
    `verifiedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `login_sessions_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `login_sessions_userId_deviceFingerprint_idx`(`userId`, `deviceFingerprint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `login_challenge_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `loginSessionId` VARCHAR(191) NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(512) NULL,
    `deviceFingerprint` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `login_challenge_tokens_tokenHash_key`(`tokenHash`),
    INDEX `login_challenge_tokens_userId_expiresAt_idx`(`userId`, `expiresAt`),
    INDEX `login_challenge_tokens_loginSessionId_expiresAt_idx`(`loginSessionId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

ALTER TABLE `friends` ADD CONSTRAINT `friends_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `friends` ADD CONSTRAINT `friends_friendId_fkey` FOREIGN KEY (`friendId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `matches` ADD CONSTRAINT `matches_hostUserId_fkey` FOREIGN KEY (`hostUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `voice_room_participants` ADD CONSTRAINT `voice_room_participants_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `voice_room_participants` ADD CONSTRAINT `voice_room_participants_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `voice_room_signals` ADD CONSTRAINT `voice_room_signals_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `voice_room_signals` ADD CONSTRAINT `voice_room_signals_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `voice_room_signals` ADD CONSTRAINT `voice_room_signals_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `chat_message_receipts` ADD CONSTRAINT `chat_message_receipts_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `chat_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `chat_message_receipts` ADD CONSTRAINT `chat_message_receipts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `vlogs` ADD CONSTRAINT `vlogs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `careers` ADD CONSTRAINT `careers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `login_sessions` ADD CONSTRAINT `login_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `login_sessions` ADD CONSTRAINT `login_sessions_refreshTokenId_fkey` FOREIGN KEY (`refreshTokenId`) REFERENCES `refresh_tokens`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `login_challenge_tokens` ADD CONSTRAINT `login_challenge_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `login_challenge_tokens` ADD CONSTRAINT `login_challenge_tokens_loginSessionId_fkey` FOREIGN KEY (`loginSessionId`) REFERENCES `login_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `block_relations` ADD CONSTRAINT `block_relations_blockerId_fkey` FOREIGN KEY (`blockerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `block_relations` ADD CONSTRAINT `block_relations_blockedId_fkey` FOREIGN KEY (`blockedId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_reportedUserId_fkey` FOREIGN KEY (`reportedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `chat_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `user_reports` ADD CONSTRAINT `user_reports_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `match_queue_entries` ADD CONSTRAINT `match_queue_entries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `match_queue_entries` ADD CONSTRAINT `match_queue_entries_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `match_queue_entries` ADD CONSTRAINT `match_queue_entries_matchedUserId_fkey` FOREIGN KEY (`matchedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `match_logs` ADD CONSTRAINT `match_logs_queueEntryId_fkey` FOREIGN KEY (`queueEntryId`) REFERENCES `match_queue_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `match_logs` ADD CONSTRAINT `match_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `match_logs` ADD CONSTRAINT `match_logs_matchedUserId_fkey` FOREIGN KEY (`matchedUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
