-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailHash` VARCHAR(191) NOT NULL,
    `emailVerificado` DATETIME(3) NULL,
    `senha` VARCHAR(191) NOT NULL,
    `imagem` VARCHAR(191) NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `nome` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_emailHash_key`(`emailHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `action_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('VERIFICACAO_EMAIL', 'REDEFINICAO_SENHA') NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `action_tokens_tokenHash_key`(`tokenHash`),
    INDEX `action_tokens_tipo_idx`(`tipo`),
    INDEX `action_tokens_userId_idx`(`userId`),
    INDEX `action_tokens_email_idx`(`email`),
    INDEX `action_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` VARCHAR(191) NULL,
    `usuarioEmail` VARCHAR(191) NULL,
    `usuarioNome` VARCHAR(191) NULL,
    `acao` VARCHAR(191) NOT NULL,
    `entidade` VARCHAR(191) NULL,
    `entidadeId` VARCHAR(191) NULL,
    `dadosAntes` JSON NULL,
    `dadosDepois` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `hash` VARCHAR(191) NOT NULL,
    `hashAnterior` VARCHAR(191) NULL,

    INDEX `audit_logs_usuarioId_idx`(`usuarioId`),
    INDEX `audit_logs_entidade_entidadeId_idx`(`entidade`, `entidadeId`),
    INDEX `audit_logs_acao_idx`(`acao`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `action_tokens` ADD CONSTRAINT `action_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

