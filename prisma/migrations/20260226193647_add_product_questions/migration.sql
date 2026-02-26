-- CreateTable
CREATE TABLE "product_questions" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answered_by_id" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMP(3),

    CONSTRAINT "product_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_questions_product_id_idx" ON "product_questions"("product_id");

-- CreateIndex
CREATE INDEX "product_questions_is_published_idx" ON "product_questions"("is_published");

-- AddForeignKey
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_answered_by_id_fkey" FOREIGN KEY ("answered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
