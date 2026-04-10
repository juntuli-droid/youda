ALTER TABLE `users`
    ADD COLUMN `publicId` VARCHAR(32) NULL;

UPDATE `users`
SET `publicId` = CONCAT('YD', UPPER(`id`))
WHERE `publicId` IS NULL;

ALTER TABLE `users`
    MODIFY `publicId` VARCHAR(32) NOT NULL;

CREATE UNIQUE INDEX `users_publicId_key` ON `users`(`publicId`);
CREATE INDEX `users_publicId_idx` ON `users`(`publicId`);
