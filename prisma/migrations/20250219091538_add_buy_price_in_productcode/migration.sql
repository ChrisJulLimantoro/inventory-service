/*
  Warnings:

  - Added the required column `buy_price` to the `product_codes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_codes" ADD COLUMN  "buy_price" DECIMAL NOT NULL DEFAULT 0;
