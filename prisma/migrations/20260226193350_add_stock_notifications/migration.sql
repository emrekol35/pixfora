-- CreateTable
CREATE TABLE "stock_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "email" TEXT NOT NULL,
    "is_notified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_at" TIMESTAMP(3),

    CONSTRAINT "stock_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_notifications_product_id_idx" ON "stock_notifications"("product_id");

-- CreateIndex
CREATE INDEX "stock_notifications_is_notified_idx" ON "stock_notifications"("is_notified");

-- CreateIndex
CREATE UNIQUE INDEX "stock_notifications_email_product_id_variant_id_key" ON "stock_notifications"("email", "product_id", "variant_id");

-- AddForeignKey
ALTER TABLE "stock_notifications" ADD CONSTRAINT "stock_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_notifications" ADD CONSTRAINT "stock_notifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
