/*
  Warnings:

  - Added the required column `dataFim` to the `eventos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "dataFim" TEXT NOT NULL,
ADD COLUMN     "diaTodo" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "horaFim" DROP NOT NULL,
ALTER COLUMN "horaInicio" DROP NOT NULL;

-- AlterTable
ALTER TABLE "eventos_excecoes" ADD COLUMN     "dataFim" TEXT,
ADD COLUMN     "diaTodo" BOOLEAN;

-- CreateIndex
CREATE INDEX "eventos_dataFim_idx" ON "eventos"("dataFim");
