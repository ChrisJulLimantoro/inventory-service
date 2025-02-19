-- CreateTable
CREATE TABLE "stock_source" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "stock_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_stocks" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "company_code" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "store_id" UUID NOT NULL,
    "store_code" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "source_id" INTEGER NOT NULL,
    "source_name" TEXT NOT NULL,
    "trans_id" UUID NOT NULL,
    "trans_code" TEXT NOT NULL,
    "trans_date" TIMESTAMP(3) NOT NULL,
    "category_id" UUID NOT NULL,
    "category_code" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "type_id" UUID NOT NULL,
    "type_code" TEXT NOT NULL,
    "type_name" TEXT NOT NULL,
    "product_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_code_code" TEXT NOT NULL,
    "product_code_id" UUID NOT NULL,
    "weight" DECIMAL NOT NULL,
    "price" DECIMAL NOT NULL,

    CONSTRAINT "report_stocks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "report_stocks" ADD CONSTRAINT "report_stocks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_stocks" ADD CONSTRAINT "report_stocks_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_stocks" ADD CONSTRAINT "report_stocks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "stock_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_stocks" ADD CONSTRAINT "report_stocks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_stocks" ADD CONSTRAINT "report_stocks_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_stocks" ADD CONSTRAINT "report_stocks_product_code_id_fkey" FOREIGN KEY ("product_code_id") REFERENCES "product_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;