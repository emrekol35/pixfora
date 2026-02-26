"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Popup {
  id: string;
  title: string;
  content: string;
  image: string | null;
  type: string;
  isActive: boolean;
  showOnce: boolean;
  delay: number;
}

export default function PopupForm({ popup }: { popup?: Popup }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: popup?.title || "",
    content: popup?.content || "",
    image: popup?.image || "",
    type: popup?.type || "general",
    isActive: popup?.isActive ?? true,
    showOnce: popup?.showOnce ?? true,
    delay: popup?.delay?.toString() || "0",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = popup ? `/api/popups/${popup.id}` : "/api/popups";
      const method = popup ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image: formData.image || undefined }),
      });

      if (res.ok) {
        router.push("/admin/icerik/popuplar");
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
        <h2 className="text-lg font-semibold mb-4">Pop-up Bilgileri</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Baslik *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Pop-up basligi" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tip</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="general">Genel</option>
                <option value="exit">Cikis (Exit Intent)</option>
                <option value="promotion">Promosyon</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Icerik *</label>
            <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Pop-up icerigi..." rows={6} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Gorsel URL</label>
              <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="/uploads/popup.jpg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gecikme (saniye)</label>
              <input type="number" min="0" value={formData.delay} onChange={(e) => setFormData({ ...formData, delay: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="isActive" className="text-sm">Aktif</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="showOnce" checked={formData.showOnce} onChange={(e) => setFormData({ ...formData, showOnce: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="showOnce" className="text-sm">Sadece bir kez goster</label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
          {loading ? "Kaydediliyor..." : popup ? "Guncelle" : "Olustur"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">Iptal</button>
      </div>
    </form>
  );
}
