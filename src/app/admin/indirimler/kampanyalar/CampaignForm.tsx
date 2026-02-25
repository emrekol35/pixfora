"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Campaign {
  id: string;
  name: string;
  type: string;
  value: number;
  conditions: Record<string, unknown> | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}

function toDateTimeLocal(date: string | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

export default function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: campaign?.name || "",
    type: campaign?.type || "PERCENTAGE",
    value: campaign?.value?.toString() || "",
    conditionsText: campaign?.conditions ? JSON.stringify(campaign.conditions, null, 2) : "",
    isActive: campaign?.isActive ?? true,
    startsAt: toDateTimeLocal(campaign?.startsAt || null),
    expiresAt: toDateTimeLocal(campaign?.expiresAt || null),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let conditions = null;
      if (formData.conditionsText.trim()) {
        try {
          conditions = JSON.parse(formData.conditionsText);
        } catch {
          alert("Kosullar gecerli JSON formati olmali.");
          setLoading(false);
          return;
        }
      }

      const url = campaign ? `/api/campaigns/${campaign.id}` : "/api/campaigns";
      const method = campaign ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          value: formData.value || undefined,
          conditions,
          isActive: formData.isActive,
          startsAt: formData.startsAt || undefined,
          expiresAt: formData.expiresAt || undefined,
        }),
      });

      if (res.ok) {
        router.push("/admin/indirimler/kampanyalar");
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
        <h2 className="text-lg font-semibold mb-4">Kampanya Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Kampanya Adi *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Yilbasi Kampanyasi"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Indirim Tipi *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="PERCENTAGE">Yuzde (%)</option>
              <option value="FIXED_AMOUNT">Sabit Tutar (TL)</option>
              <option value="FREE_SHIPPING">Ucretsiz Kargo</option>
            </select>
          </div>
          {formData.type !== "FREE_SHIPPING" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {formData.type === "PERCENTAGE" ? "Yuzde (%)" : "Tutar (TL)"} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Kosullar (JSON)</label>
            <textarea
              value={formData.conditionsText}
              onChange={(e) => setFormData({ ...formData, conditionsText: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder='{"minOrderAmount": 100, "categoryIds": ["..."]}'
            />
            <p className="text-xs text-muted-foreground mt-1">Opsiyonel. JSON formati ile kampanya kosullari belirleyebilirsiniz.</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Gecerlilik</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Baslangic Tarihi</label>
            <input
              type="datetime-local"
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bitis Tarihi</label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : campaign ? "Guncelle" : "Olustur"}
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
