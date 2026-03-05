-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "is_company" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tax_number" TEXT,
ADD COLUMN     "tax_office" TEXT;

-- CreateTable
CREATE TABLE "bank_transfer_receipts" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transfer_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_transfer_receipts_order_id_idx" ON "bank_transfer_receipts"("order_id");

-- CreateIndex
CREATE INDEX "bank_transfer_receipts_status_idx" ON "bank_transfer_receipts"("status");

-- AddForeignKey
ALTER TABLE "bank_transfer_receipts" ADD CONSTRAINT "bank_transfer_receipts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
