/*
  Warnings:

  - You are about to drop the `report_stocks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_source` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "report_stocks" DROP CONSTRAINT "report_stocks_category_id_fkey";

-- DropForeignKey
ALTER TABLE "report_stocks" DROP CONSTRAINT "report_stocks_company_id_fkey";

-- DropForeignKey
ALTER TABLE "report_stocks" DROP CONSTRAINT "report_stocks_product_code_id_fkey";

-- DropForeignKey
ALTER TABLE "report_stocks" DROP CONSTRAINT "report_stocks_source_id_fkey";

-- DropForeignKey
ALTER TABLE "report_stocks" DROP CONSTRAINT "report_stocks_store_id_fkey";

-- DropForeignKey
ALTER TABLE "report_stocks" DROP CONSTRAINT "report_stocks_type_id_fkey";

-- DropTable
DROP TABLE "report_stocks";

-- DropTable
DROP TABLE "stock_source";
