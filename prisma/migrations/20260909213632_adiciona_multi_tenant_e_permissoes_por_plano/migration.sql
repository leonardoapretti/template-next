-- AlterEnum
ALTER TYPE "ActionTokenTipo" ADD VALUE 'CONVITE_MEMBRO_EMPRESA';

-- DropForeignKey
ALTER TABLE "eventos" DROP CONSTRAINT "eventos_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";

-- DropIndex
DROP INDEX "eventos_userId_idx";

-- DropIndex
DROP INDEX "roles_nome_key";

-- DropIndex
DROP INDEX "users_roleId_idx";

-- AlterTable
ALTER TABLE "action_tokens" ADD COLUMN     "empresaId" TEXT,
ADD COLUMN     "roleId" TEXT;

-- AlterTable
ALTER TABLE "eventos" DROP COLUMN "userId",
ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "empresaId" TEXT,
ADD COLUMN     "padraoSistema" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "roleId";

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "planoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_empresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membros_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_permissoes" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "permitido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "empresas_planoId_idx" ON "empresas"("planoId");

-- CreateIndex
CREATE INDEX "membros_empresa_empresaId_idx" ON "membros_empresa"("empresaId");

-- CreateIndex
CREATE INDEX "membros_empresa_usuarioId_idx" ON "membros_empresa"("usuarioId");

-- CreateIndex
CREATE INDEX "membros_empresa_roleId_idx" ON "membros_empresa"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "membros_empresa_empresaId_usuarioId_key" ON "membros_empresa"("empresaId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "planos_codigo_key" ON "planos"("codigo");

-- CreateIndex
CREATE INDEX "planos_permissoes_planoId_idx" ON "planos_permissoes"("planoId");

-- CreateIndex
CREATE UNIQUE INDEX "planos_permissoes_planoId_chave_key" ON "planos_permissoes"("planoId", "chave");

-- CreateIndex
CREATE INDEX "action_tokens_empresaId_idx" ON "action_tokens"("empresaId");

-- CreateIndex
CREATE INDEX "eventos_empresaId_idx" ON "eventos"("empresaId");

-- CreateIndex
CREATE INDEX "roles_empresaId_idx" ON "roles"("empresaId");

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_empresa" ADD CONSTRAINT "membros_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_empresa" ADD CONSTRAINT "membros_empresa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_empresa" ADD CONSTRAINT "membros_empresa_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_permissoes" ADD CONSTRAINT "planos_permissoes_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_tokens" ADD CONSTRAINT "action_tokens_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_tokens" ADD CONSTRAINT "action_tokens_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- Backfill de dados: Role deixa de ser global (User.roleId) e passa a ser
-- por empresa (MembroEmpresa.roleId); Evento deixa de pertencer a um User
-- e passa a pertencer a uma Empresa. Para não descartar dados de ambiente
-- de dev/demo já existentes, cria uma empresa "bootstrap" com os papéis
-- padrão, vincula todo usuário já existente a ela como Proprietário, e
-- reatribui os eventos órfãos a essa empresa. Empresas criadas depois
-- (ver prisma/seed-empresas.ts) não passam por aqui.
-- ─────────────────────────────────────────────

INSERT INTO "planos" ("id", "codigo", "nome", "ativo", "updatedAt")
VALUES ('bootstrap-plano-padrao', 'PADRAO', 'Padrão', true, CURRENT_TIMESTAMP)
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "planos_permissoes" ("id", "planoId", "chave", "permitido", "updatedAt")
SELECT 'bootstrap-plano-permissao-' || chave, 'bootstrap-plano-padrao', chave, true, CURRENT_TIMESTAMP
FROM unnest(ARRAY[
  'empresa:convidar', 'empresa:configurar', 'papeis:gerenciar',
  'agenda:create', 'agenda:update', 'agenda:delete'
]) AS chave
ON CONFLICT ("planoId", "chave") DO NOTHING;

INSERT INTO "empresas" ("id", "nome", "ativo", "planoId", "updatedAt")
VALUES ('bootstrap-empresa-demo', 'Empresa de Demonstração', true, 'bootstrap-plano-padrao', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "roles" ("id", "nome", "permissoes", "empresaId", "padraoSistema", "updatedAt")
VALUES
  ('bootstrap-role-proprietario', 'Proprietário', ARRAY[
    'empresa:convidar', 'empresa:configurar', 'papeis:gerenciar',
    'agenda:create', 'agenda:update', 'agenda:delete'
  ], 'bootstrap-empresa-demo', true, CURRENT_TIMESTAMP),
  ('bootstrap-role-administrador', 'Administrador', ARRAY[
    'empresa:convidar', 'empresa:configurar', 'papeis:gerenciar',
    'agenda:create', 'agenda:update', 'agenda:delete'
  ], 'bootstrap-empresa-demo', true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "membros_empresa" ("id", "empresaId", "usuarioId", "roleId", "ativo", "updatedAt")
SELECT 'bootstrap-membro-' || "id", 'bootstrap-empresa-demo', "id", 'bootstrap-role-proprietario', true, CURRENT_TIMESTAMP
FROM "users"
ON CONFLICT ("empresaId", "usuarioId") DO NOTHING;

UPDATE "eventos" SET "empresaId" = 'bootstrap-empresa-demo' WHERE "empresaId" IS NULL;

-- Agora que nenhuma Role de exemplo real terá empresaId nulo (0 linhas
-- pré-existentes na tabela roles antes desta migration), a coluna pode
-- virar NOT NULL com segurança.
ALTER TABLE "roles" ALTER COLUMN "empresaId" SET NOT NULL;

-- CreateIndex (unique, só depois do backfill acima garantir empresaId preenchido)
CREATE UNIQUE INDEX "roles_empresaId_nome_key" ON "roles"("empresaId", "nome");
