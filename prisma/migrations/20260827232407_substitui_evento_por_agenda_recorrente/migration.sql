/*
  Warnings:

  - You are about to drop the column `descricao` on the `eventos` table. All the data in the column will be lost.
  - You are about to drop the column `diaTodo` on the `eventos` table. All the data in the column will be lost.
  - You are about to drop the column `fim` on the `eventos` table. All the data in the column will be lost.
  - You are about to drop the column `inicio` on the `eventos` table. All the data in the column will be lost.
  - Added the required column `data` to the `eventos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `horaFim` to the `eventos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `horaInicio` to the `eventos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FrequenciaEvento" AS ENUM ('NENHUMA', 'DIARIA', 'SEMANAL', 'MENSAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "StatusExcecaoEvento" AS ENUM ('ALTERADO', 'REMARCADO', 'CANCELADO');

-- DropIndex
DROP INDEX "eventos_userId_inicio_idx";

-- AlterTable
ALTER TABLE "eventos" DROP COLUMN "descricao",
DROP COLUMN "diaTodo",
DROP COLUMN "fim",
DROP COLUMN "inicio",
ADD COLUMN     "data" TEXT NOT NULL,
ADD COLUMN     "horaFim" TEXT NOT NULL,
ADD COLUMN     "horaInicio" TEXT NOT NULL,
ADD COLUMN     "observacao" TEXT,
ADD COLUMN     "recorrencia" "FrequenciaEvento" NOT NULL DEFAULT 'NENHUMA',
ADD COLUMN     "recorrenciaAte" TEXT;

-- CreateTable
CREATE TABLE "eventos_excecoes" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "dataOriginal" TEXT NOT NULL,
    "status" "StatusExcecaoEvento" NOT NULL,
    "titulo" TEXT,
    "data" TEXT,
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_excecoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_excecoes_eventoId_idx" ON "eventos_excecoes"("eventoId");

-- CreateIndex
CREATE INDEX "eventos_excecoes_dataOriginal_idx" ON "eventos_excecoes"("dataOriginal");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_excecoes_eventoId_dataOriginal_key" ON "eventos_excecoes"("eventoId", "dataOriginal");

-- CreateIndex
CREATE INDEX "eventos_userId_idx" ON "eventos"("userId");

-- CreateIndex
CREATE INDEX "eventos_data_idx" ON "eventos"("data");

-- CreateIndex
CREATE INDEX "eventos_recorrencia_idx" ON "eventos"("recorrencia");

-- AddForeignKey
ALTER TABLE "eventos_excecoes" ADD CONSTRAINT "eventos_excecoes_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
