-- CreateEnum
CREATE TYPE "TrendyolSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'NOT_SYNCED');

-- CreateTable
CREATE TABLE "trendyol_products" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "trendyol_product_id" TEXT,
    "trendyol_barcode" TEXT,
    "batch_request_id" TEXT,
    "sync_status" "TrendyolSyncStatus" NOT NULL DEFAULT 'PENDING',
    "last_synced_at" TIMESTAMP(3),
    "last_error" TEXT,
    "trendyol_category_id" INTEGER,
    "trendyol_brand_id" INTEGER,
    "attributes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trendyol_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trendyol_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "trendyol_order_number" TEXT NOT NULL,
    "trendyol_package_id" TEXT,
    "shipment_package_status" TEXT,
    "raw_data" JSONB NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trendyol_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trendyol_categories" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "path" TEXT,
    "local_category_id" TEXT,

    CONSTRAINT "trendyol_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trendyol_brands" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "local_brand_id" TEXT,

    CONSTRAINT "trendyol_brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trendyol_products_product_id_key" ON "trendyol_products"("product_id");

-- CreateIndex
CREATE INDEX "trendyol_products_sync_status_idx" ON "trendyol_products"("sync_status");

-- CreateIndex
CREATE INDEX "trendyol_products_batch_request_id_idx" ON "trendyol_products"("batch_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "trendyol_orders_trendyol_order_number_key" ON "trendyol_orders"("trendyol_order_number");

-- CreateIndex
CREATE INDEX "trendyol_orders_order_id_idx" ON "trendyol_orders"("order_id");

-- CreateIndex
CREATE INDEX "trendyol_orders_trendyol_package_id_idx" ON "trendyol_orders"("trendyol_package_id");

-- AddForeignKey
ALTER TABLE "trendyol_products" ADD CONSTRAINT "trendyol_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trendyol_orders" ADD CONSTRAINT "trendyol_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trendyol_categories" ADD CONSTRAINT "trendyol_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "trendyol_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trendyol_categories" ADD CONSTRAINT "trendyol_categories_local_category_id_fkey" FOREIGN KEY ("local_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trendyol_brands" ADD CONSTRAINT "trendyol_brands_local_brand_id_fkey" FOREIGN KEY ("local_brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
