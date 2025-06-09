/*
  Warnings:

  - A unique constraint covering the columns `[store_id,category_id,date,deleted_at]` on the table `stock_opnames` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "stock_opnames_store_id_category_id_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "stock_opnames_store_id_category_id_date_deleted_at_key" ON "stock_opnames"("store_id", "category_id", "date", "deleted_at");
