/*
  Warnings:

  - You are about to drop the column `fixed_price` on the `products` table. All the data in the column will be lost.
  - Added the required column `fixed_price` to the `product_codes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_codes" ADD COLUMN     "fixed_price" DECIMAL NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "fixed_price";

-- CreateTable
CREATE TABLE "operations" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "uom" TEXT NOT NULL,
    "description" TEXT,
    "store_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operations_deleted_at_idx" ON "operations"("deleted_at");

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
