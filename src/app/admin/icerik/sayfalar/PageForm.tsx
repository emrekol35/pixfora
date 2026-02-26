"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Page {
  id: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export default function PageForm({ page }: { page?: Page }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: page?.title || "",
    content: page?.content || "",
    order: page?.order?.toString() || "0",
    isActive: page?.isActive ?? true,
    seoTitle: page?.seoTitle || "",
    seoDescription: page?.seoDescription || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = page ? `/api/pages/${page.id}` : "/api/pages";
      const method = page ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          order: formData.order || "0",
          seoTitle: formData.seoTitle || undefined,
          seoDescription: formData.seoDescription || undefined,
        }),
      });

      if (res.ok) {
        router.push("/admin/icerik/sayfalar");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Islem basarisiz.");
      }
    } catch {
      alert("Bir hata olustu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Sayfa Bilgileri</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Baslik *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Hakkimizda"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Icerik *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Sayfa icerigi..."
              rows={12}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Siralama</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm">Aktif</label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">SEO Ayarlari</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">SEO Basligi</label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Sayfa basligi (arama motorlari icin)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SEO Aciklamasi</label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Sayfa aciklamasi (arama motorlari icin)"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : page ? "Guncelle" : "Olustur"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
        >
          Iptal
        </button>
      </div>
    </form>
  );
}
