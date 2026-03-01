-- CreateEnum
CREATE TYPE "HepsiburadaSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'NOT_SYNCED');

-- CreateTable
CREATE TABLE "hepsiburada_products" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "hepsiburada_sku" TEXT,
    "merchant_sku" TEXT,
    "barcode" TEXT,
    "sync_status" "HepsiburadaSyncStatus" NOT NULL DEFAULT 'PENDING',
    "last_synced_at" TIMESTAMP(3),
    "last_error" TEXT,
    "hepsiburada_category_id" INTEGER,
    "brand_name" TEXT,
    "attributes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hepsiburada_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hepsiburada_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "hb_order_number" TEXT NOT NULL,
    "hb_package_number" TEXT,
    "order_status" TEXT,
    "raw_data" JSONB NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hepsiburada_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hepsiburada_categories" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "path" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "leaf" BOOLEAN NOT NULL DEFAULT false,
    "local_category_id" TEXT,

    CONSTRAINT "hepsiburada_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hepsiburada_products_product_id_key" ON "hepsiburada_products"("product_id");

-- CreateIndex
CREATE INDEX "hepsiburada_products_sync_status_idx" ON "hepsiburada_products"("sync_status");

-- CreateIndex
CREATE UNIQUE INDEX "hepsiburada_orders_hb_order_number_key" ON "hepsiburada_orders"("hb_order_number");

-- CreateIndex
CREATE INDEX "hepsiburada_orders_order_id_idx" ON "hepsiburada_orders"("order_id");

-- CreateIndex
CREATE INDEX "hepsiburada_orders_hb_package_number_idx" ON "hepsiburada_orders"("hb_package_number");

-- AddForeignKey
ALTER TABLE "hepsiburada_products" ADD CONSTRAINT "hepsiburada_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hepsiburada_orders" ADD CONSTRAINT "hepsiburada_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hepsiburada_categories" ADD CONSTRAINT "hepsiburada_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "hepsiburada_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hepsiburada_categories" ADD CONSTRAINT "hepsiburada_categories_local_category_id_fkey" FOREIGN KEY ("local_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
