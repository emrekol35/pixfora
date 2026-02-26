"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Redirect {
  id: string;
  fromPath: string;
  toPath: string;
  type: number;
}

export default function RedirectForm({ redirect }: { redirect?: Redirect }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromPath: redirect?.fromPath || "",
    toPath: redirect?.toPath || "",
    type: redirect?.type?.toString() || "301",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = redirect ? `/api/redirects/${redirect.id}` : "/api/redirects";
      const method = redirect ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/admin/seo");
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
        <h2 className="text-lg font-semibold mb-4">Yonlendirme Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kaynak Yol *</label>
            <input
              type="text"
              value={formData.fromPath}
              onChange={(e) => setFormData({ ...formData, fromPath: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              placeholder="/eski-sayfa"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Ornek: /eski-urun-sayfasi</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hedef Yol *</label>
            <input
              type="text"
              value={formData.toPath}
              onChange={(e) => setFormData({ ...formData, toPath: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              placeholder="/yeni-sayfa"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Ornek: /yeni-urun-sayfasi</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Yonlendirme Tipi</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="301">301 - Kalici Yonlendirme</option>
              <option value="302">302 - Gecici Yonlendirme</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : redirect ? "Guncelle" : "Olustur"}
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
