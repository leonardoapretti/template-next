-- CreateEnum
CREATE TYPE "ActionTokenTipo" AS ENUM ('VERIFICACAO_EMAIL', 'REDEFINICAO_SENHA', 'ALTERACAO_EMAIL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "emailVerificado" TIMESTAMP(3),
    "senha" TEXT NOT NULL,
    "imagem" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_tokens" (
    "id" TEXT NOT NULL,
    "tipo" "ActionTokenTipo" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "usuarioEmail" TEXT,
    "usuarioNome" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT,
    "entidadeId" TEXT,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "hash" TEXT NOT NULL,
    "hashAnterior" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_emailHash_key" ON "users"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "action_tokens_tokenHash_key" ON "action_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "action_tokens_tipo_idx" ON "action_tokens"("tipo");

-- CreateIndex
CREATE INDEX "action_tokens_userId_idx" ON "action_tokens"("userId");

-- CreateIndex
CREATE INDEX "action_tokens_email_idx" ON "action_tokens"("email");

-- CreateIndex
CREATE INDEX "action_tokens_expiresAt_idx" ON "action_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_usuarioId_idx" ON "audit_logs"("usuarioId");

-- CreateIndex
CREATE INDEX "audit_logs_entidade_entidadeId_idx" ON "audit_logs"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "audit_logs_acao_idx" ON "audit_logs"("acao");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "action_tokens" ADD CONSTRAINT "action_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
