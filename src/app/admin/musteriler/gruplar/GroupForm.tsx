"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Group {
  id: string;
  name: string;
  discountPercent: number;
}

export default function GroupForm({ group }: { group?: Group }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: group?.name || "",
    discountPercent: group?.discountPercent?.toString() || "0",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = group ? "/api/user-groups/" + group.id : "/api/user-groups";
      const method = group ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/admin/musteriler/gruplar");
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
        <h2 className="text-lg font-semibold mb-4">Grup Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Grup Adi *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="VIP Musteriler" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Indirim Yuzdesi (%)</label>
            <input type="number" step="0.01" min="0" max="100" value={formData.discountPercent} onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
          {loading ? "Kaydediliyor..." : group ? "Guncelle" : "Olustur"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">Iptal</button>
      </div>
    </form>
  );
}
