-- AlterTable
ALTER TABLE "products" ADD COLUMN     "sales_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "products_sales_count_idx" ON "products"("sales_count");
