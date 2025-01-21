-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_flex_price" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_float_price" BOOLEAN NOT NULL DEFAULT false;
