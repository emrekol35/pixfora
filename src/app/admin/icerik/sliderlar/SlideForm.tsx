"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Slide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string;
  link: string | null;
  order: number;
  isActive: boolean;
}

export default function SlideForm({ slide }: { slide?: Slide }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: slide?.title || "",
    subtitle: slide?.subtitle || "",
    image: slide?.image || "",
    link: slide?.link || "",
    order: slide?.order?.toString() || "0",
    isActive: slide?.isActive ?? true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = slide ? `/api/slides/${slide.id}` : "/api/slides";
      const method = slide ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          title: formData.title || undefined,
          subtitle: formData.subtitle || undefined,
          link: formData.link || undefined,
        }),
      });

      if (res.ok) {
        router.push("/admin/icerik/sliderlar");
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
        <h2 className="text-lg font-semibold mb-4">Slider Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Baslik</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Slider basligi" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alt Baslik</label>
            <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Slider alt basligi" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gorsel URL *</label>
            <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="/uploads/slider/gorsel.jpg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link</label>
            <input type="text" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="/kategori/yeni-urunler" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Siralama</label>
            <input type="number" min="0" value={formData.order} onChange={(e) => setFormData({ ...formData, order: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="isActive" className="text-sm">Aktif</label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
          {loading ? "Kaydediliyor..." : slide ? "Guncelle" : "Olustur"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">Iptal</button>
      </div>
    </form>
  );
}
