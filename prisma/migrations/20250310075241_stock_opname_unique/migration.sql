/*
  Warnings:

  - A unique constraint covering the columns `[stock_opname_id,product_code_id]` on the table `stock_opname_details` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,category_id,date]` on the table `stock_opnames` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "stock_opname_details" DROP CONSTRAINT "stock_opname_details_stock_opname_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "stock_opname_details_stock_opname_id_product_code_id_key" ON "stock_opname_details"("stock_opname_id", "product_code_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_opnames_store_id_category_id_date_key" ON "stock_opnames"("store_id", "category_id", "date");

-- AddForeignKey
ALTER TABLE "stock_opname_details" ADD CONSTRAINT "stock_opname_details_stock_opname_id_fkey" FOREIGN KEY ("stock_opname_id") REFERENCES "stock_opnames"("id") ON DELETE CASCADE ON UPDATE CASCADE;
