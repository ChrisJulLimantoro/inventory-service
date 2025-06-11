-- AlterTable
ALTER TABLE "product_codes" ADD COLUMN     "certificate_link" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
