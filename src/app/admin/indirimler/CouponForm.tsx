"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}

function toDateTimeLocal(date: string | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

export default function CouponForm({ coupon }: { coupon?: Coupon }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: coupon?.code || "",
    type: coupon?.type || "PERCENTAGE",
    value: coupon?.value?.toString() || "",
    minOrder: coupon?.minOrder?.toString() || "",
    maxDiscount: coupon?.maxDiscount?.toString() || "",
    maxUses: coupon?.maxUses?.toString() || "",
    isActive: coupon?.isActive ?? true,
    startsAt: toDateTimeLocal(coupon?.startsAt || null),
    expiresAt: toDateTimeLocal(coupon?.expiresAt || null),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = coupon ? `/api/coupons/${coupon.id}` : "/api/coupons";
      const method = coupon ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          code: formData.code.toUpperCase().trim(),
          value: formData.value || undefined,
          minOrder: formData.minOrder || undefined,
          maxDiscount: formData.maxDiscount || undefined,
          maxUses: formData.maxUses || undefined,
          startsAt: formData.startsAt || undefined,
          expiresAt: formData.expiresAt || undefined,
        }),
      });

      if (res.ok) {
        router.push("/admin/indirimler");
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
        <h2 className="text-lg font-semibold mb-4">Kupon Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kupon Kodu *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              placeholder="YILBASI20"
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
          <div>
            <label className="block text-sm font-medium mb-1">Min. Siparis Tutari (TL)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.minOrder}
              onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Opsiyonel"
            />
          </div>
          {formData.type === "PERCENTAGE" && (
            <div>
              <label className="block text-sm font-medium mb-1">Max. Indirim (TL)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Opsiyonel"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Max. Kullanim Sayisi</label>
            <input
              type="number"
              min="0"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Sinirsiz"
            />
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
          {loading ? "Kaydediliyor..." : coupon ? "Guncelle" : "Olustur"}
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
