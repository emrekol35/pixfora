-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translated_slugs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translated_slugs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "translations_entity_type_entity_id_locale_idx" ON "translations"("entity_type", "entity_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "translations_entity_type_entity_id_locale_field_key" ON "translations"("entity_type", "entity_id", "locale", "field");

-- CreateIndex
CREATE UNIQUE INDEX "translated_slugs_entity_type_locale_slug_key" ON "translated_slugs"("entity_type", "locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "translated_slugs_entity_type_entity_id_locale_key" ON "translated_slugs"("entity_type", "entity_id", "locale");
