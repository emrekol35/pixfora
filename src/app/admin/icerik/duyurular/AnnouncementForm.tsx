"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Announcement {
  id: string;
  text: string;
  link: string | null;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  type: string;
}

export default function AnnouncementForm({ announcement }: { announcement?: Announcement }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    text: announcement?.text || "",
    link: announcement?.link || "",
    bgColor: announcement?.bgColor || "#000000",
    textColor: announcement?.textColor || "#ffffff",
    isActive: announcement?.isActive ?? true,
    type: announcement?.type || "bar",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = announcement ? `/api/announcements/${announcement.id}` : "/api/announcements";
      const method = announcement ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, link: formData.link || undefined }),
      });

      if (res.ok) {
        router.push("/admin/icerik/duyurular");
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
        <h2 className="text-lg font-semibold mb-4">Duyuru Bilgileri</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duyuru Metni *</label>
            <input type="text" value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ucretsiz kargo 500₺ ve uzeri siparislerde!" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Link</label>
              <input type="text" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="/kampanyalar" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tip</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="bar">Ust Bar</option>
                <option value="notification">Bildirim</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Arkaplan Rengi</label>
              <div className="flex items-center gap-2">
                <input type="color" value={formData.bgColor} onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })} className="w-10 h-10 rounded border border-border cursor-pointer" />
                <input type="text" value={formData.bgColor} onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })} className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Yazi Rengi</label>
              <div className="flex items-center gap-2">
                <input type="color" value={formData.textColor} onChange={(e) => setFormData({ ...formData, textColor: e.target.value })} className="w-10 h-10 rounded border border-border cursor-pointer" />
                <input type="text" value={formData.textColor} onChange={(e) => setFormData({ ...formData, textColor: e.target.value })} className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="isActive" className="text-sm">Aktif</label>
          </div>
          {/* Onizleme */}
          <div>
            <label className="block text-sm font-medium mb-1">Onizleme</label>
            <div className="rounded-lg px-4 py-2 text-sm text-center" style={{ backgroundColor: formData.bgColor, color: formData.textColor }}>
              {formData.text || "Duyuru metni buraya gelecek"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
          {loading ? "Kaydediliyor..." : announcement ? "Guncelle" : "Olustur"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">Iptal</button>
      </div>
    </form>
  );
}
