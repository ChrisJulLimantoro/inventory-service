-- AlterTable
ALTER TABLE "product_codes" ADD COLUMN     "taken_out_by" UUID,
ADD COLUMN     "taken_out_reason" INTEGER NOT NULL DEFAULT 0;
