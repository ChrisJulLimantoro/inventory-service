-- CreateTable
CREATE TABLE "stock_opnames" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "store_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approve_by" UUID,
    "approve_at" TIMESTAMP(3),
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stock_opnames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opname_details" (
    "id" UUID NOT NULL,
    "stock_opname_id" UUID NOT NULL,
    "product_code_id" UUID NOT NULL,
    "description" TEXT,
    "scanned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stock_opname_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_opnames_deleted_at_idx" ON "stock_opnames"("deleted_at");

-- CreateIndex
CREATE INDEX "stock_opname_details_deleted_at_idx" ON "stock_opname_details"("deleted_at");

-- AddForeignKey
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname_details" ADD CONSTRAINT "stock_opname_details_stock_opname_id_fkey" FOREIGN KEY ("stock_opname_id") REFERENCES "stock_opnames"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname_details" ADD CONSTRAINT "stock_opname_details_product_code_id_fkey" FOREIGN KEY ("product_code_id") REFERENCES "product_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
