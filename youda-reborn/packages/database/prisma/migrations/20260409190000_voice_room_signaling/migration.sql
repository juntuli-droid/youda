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

ALTER TABLE `voice_room_participants`
    ADD CONSTRAINT `voice_room_participants_matchId_fkey`
    FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `voice_room_participants`
    ADD CONSTRAINT `voice_room_participants_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `voice_room_signals`
    ADD CONSTRAINT `voice_room_signals_matchId_fkey`
    FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `voice_room_signals`
    ADD CONSTRAINT `voice_room_signals_senderId_fkey`
    FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `voice_room_signals`
    ADD CONSTRAINT `voice_room_signals_targetUserId_fkey`
    FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
