/*
  Warnings:

  - Made the column `empresaId` on table `eventos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "eventos" ALTER COLUMN "empresaId" SET NOT NULL;
