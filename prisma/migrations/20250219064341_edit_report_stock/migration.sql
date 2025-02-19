/*
  Warnings:

  - Added the required column `code` to the `stock_source` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stock_source" ADD COLUMN     "code" TEXT NOT NULL;
