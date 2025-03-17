/*
  Warnings:

  - You are about to drop the column `is_approved` on the `stock_opnames` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stock_opnames" DROP COLUMN "is_approved",
ADD COLUMN     "approve" BOOLEAN NOT NULL DEFAULT false;
