/*
  Warnings:

  - Added the required column `weight` to the `product_codes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_codes" ADD COLUMN     "weight" DECIMAL NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "images" TEXT[];
