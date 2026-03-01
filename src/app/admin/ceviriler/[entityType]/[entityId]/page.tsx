"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TranslationData {
  original: Record<string, string | null>;
  translations: Record<string, string>;
  translatedSlug: string;
  fields: string[];
}

const TYPE_LABELS: Record<string, string> = {
  product: "Ürün",
  category: "Kategori",
  brand: "Marka",
  page: "Sayfa",
  blogPost: "Blog Yazısı",
  slide: "Slider",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Ad",
  title: "Başlık",
  description: "Açıklama",
  shortDesc: "Kısa Açıklama",
  content: "İçerik",
  excerpt: "Özet",
  subtitle: "Alt Başlık",
  seoTitle: "SEO Başlık",
  seoDescription: "SEO Açıklama",
  seoKeywords: "SEO Anahtar Kelimeler",
};

// Uzun metin alanları — textarea ile gösterilecek
const LONG_TEXT_FIELDS = ["description", "shortDesc", "content", "excerpt", "seoDescription"];

export default function TranslationEditorPage({
  params,
}: {
  params: Promise<{ entityType: string; entityId: string }>;
}) {
  const { entityType, entityId } = use(params);
  const router = useRouter();

  const [data, setData] = useState<TranslationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [slug, setSlug] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const label = TYPE_LABELS[entityType] || entityType;

  useEffect(() => {
    fetch(`/api/admin/translations/${entityType}/${entityId}?locale=en`)
      .then((r) => r.json())
      .then((d: TranslationData) => {
        setData(d);
        setFormData(d.translations || {});
        setSlug(d.translatedSlug || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entityType, entityId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/translations/${entityType}/${entityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: "en",
          translations: formData,
          slug: slug || undefined,
        }),
      });
      if (res.ok) {
        setToast("Çeviriler başarıyla kaydedildi!");
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast("Hata oluştu!");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Hata oluştu!");
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Entity bulunamadı.</p>
      </div>
    );
  }

  const originalName = data.original.name || data.original.title || "Bilinmeyen";

  return (
    <div className="p-6 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
        <Link href="/admin/ceviriler" className="text-muted-foreground hover:text-foreground">
          Çeviriler
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          href={`/admin/ceviriler/${entityType}`}
          className="text-muted-foreground hover:text-foreground"
        >
          {TYPE_LABELS[entityType] || entityType}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium truncate max-w-[300px]">{originalName}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">
          {label} Çevirisi: {originalName}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      {/* Slug çevirisi (ürün, kategori, marka, sayfa, blog için) */}
      {["product", "category", "brand", "page", "blogPost"].includes(entityType) && (
        <div className="mb-8 p-4 bg-card border border-border rounded-xl">
          <h3 className="font-semibold mb-3">URL Slug Çevirisi</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Orijinal Slug (TR)</label>
              <input
                type="text"
                value={data.original.slug || ""}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">İngilizce Slug (EN)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ingilizce-slug"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Alan çevirileri */}
      <div className="space-y-6">
        {data.fields.map((field) => {
          const isLongText = LONG_TEXT_FIELDS.includes(field);
          const originalValue = data.original[field] || "";
          const translatedValue = formData[field] || "";

          return (
            <div key={field} className="p-4 bg-card border border-border rounded-xl">
              <h3 className="font-semibold mb-3">{FIELD_LABELS[field] || field}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Orijinal (TR) */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Türkçe (Orijinal)
                  </label>
                  {isLongText ? (
                    <textarea
                      value={String(originalValue)}
                      disabled
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(originalValue)}
                      disabled
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted"
                    />
                  )}
                </div>

                {/* Çeviri (EN) */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    İngilizce (Çeviri)
                  </label>
                  {isLongText ? (
                    <textarea
                      value={translatedValue}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      rows={4}
                      placeholder={`${FIELD_LABELS[field] || field} çevirisi...`}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={translatedValue}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      placeholder={`${FIELD_LABELS[field] || field} çevirisi...`}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Altta da kaydet butonu */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
