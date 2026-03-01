-- CreateEnum
CREATE TYPE "N11SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'NOT_SYNCED');

-- CreateTable
CREATE TABLE "n11_products" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "n11_product_id" BIGINT,
    "stock_code" TEXT,
    "barcode" TEXT,
    "sync_status" "N11SyncStatus" NOT NULL DEFAULT 'PENDING',
    "last_synced_at" TIMESTAMP(3),
    "last_error" TEXT,
    "n11_category_id" BIGINT,
    "brand_name" TEXT,
    "attributes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "n11_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "n11_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "n11_order_number" TEXT NOT NULL,
    "n11_package_id" TEXT,
    "order_status" TEXT,
    "raw_data" JSONB NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "n11_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "n11_categories" (
    "id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" BIGINT,
    "path" TEXT,
    "leaf" BOOLEAN NOT NULL DEFAULT false,
    "local_category_id" TEXT,

    CONSTRAINT "n11_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "n11_products_product_id_key" ON "n11_products"("product_id");

-- CreateIndex
CREATE INDEX "n11_products_sync_status_idx" ON "n11_products"("sync_status");

-- CreateIndex
CREATE UNIQUE INDEX "n11_orders_n11_order_number_key" ON "n11_orders"("n11_order_number");

-- CreateIndex
CREATE INDEX "n11_orders_order_id_idx" ON "n11_orders"("order_id");

-- CreateIndex
CREATE INDEX "n11_orders_n11_package_id_idx" ON "n11_orders"("n11_package_id");

-- AddForeignKey
ALTER TABLE "n11_products" ADD CONSTRAINT "n11_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "n11_orders" ADD CONSTRAINT "n11_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "n11_categories" ADD CONSTRAINT "n11_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "n11_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "n11_categories" ADD CONSTRAINT "n11_categories_local_category_id_fkey" FOREIGN KEY ("local_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
