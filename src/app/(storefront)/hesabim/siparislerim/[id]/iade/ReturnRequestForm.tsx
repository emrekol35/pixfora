"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const RETURN_REASONS = [
  { value: "defective", label: "Kusurlu / Bozuk Urun" },
  { value: "wrong_item", label: "Yanlis Urun Gonderildi" },
  { value: "changed_mind", label: "Fikir Degisikligi" },
  { value: "damaged", label: "Hasarli Urun (Kargo)" },
  { value: "not_as_described", label: "Urun Tarifine Uymuyor" },
  { value: "other", label: "Diger" },
];

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  productSlug: string;
  productImage: string | null;
}

interface Props {
  order: {
    id: string;
    orderNumber: string;
    items: OrderItem[];
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

export default function ReturnRequestForm({ order }: Props) {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<
    Record<string, { selected: boolean; quantity: number; reason: string }>
  >({});
  const [generalReason, setGeneralReason] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleItem = (itemId: string, item: OrderItem) => {
    setSelectedItems((prev) => {
      if (prev[itemId]?.selected) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { selected: true, quantity: item.quantity, reason: "" },
      };
    });
  };

  const updateItemQty = (itemId: string, qty: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: qty },
    }));
  };

  const updateItemReason = (itemId: string, reason: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], reason },
    }));
  };

  const selectedCount = Object.values(selectedItems).filter((i) => i.selected).length;

  const refundAmount = Object.entries(selectedItems)
    .filter(([, v]) => v.selected)
    .reduce((sum, [id, v]) => {
      const item = order.items.find((i) => i.id === id);
      return sum + (item ? item.price * v.quantity : 0);
    }, 0);

  const handleSubmit = async () => {
    if (selectedCount === 0) {
      setError("En az bir urun secmelisiniz");
      return;
    }
    if (!generalReason) {
      setError("Iade nedeni secmelisiniz");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const items = Object.entries(selectedItems)
        .filter(([, v]) => v.selected)
        .map(([id, v]) => ({
          orderItemId: id,
          quantity: v.quantity,
          reason: v.reason || undefined,
        }));

      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          items,
          reason: generalReason,
          note: note || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/hesabim/iadelerim/${data.id}`);
      } else {
        setError(data.error || "Iade talebi olusturulamadi");
      }
    } catch {
      setError("Bir hata olustu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/hesabim/siparislerim/${order.id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        &larr; Siparis Detayina Don
      </Link>

      <h1 className="text-2xl font-bold mb-2">Iade Talebi Olustur</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Siparis #{order.orderNumber}
      </p>

      {/* Urun Secimi */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Iade Edilecek Urunler</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Iade etmek istediginiz urunleri secin
          </p>
        </div>
        <div className="divide-y divide-border">
          {order.items.map((item) => {
            const sel = selectedItems[item.id];
            const isSelected = sel?.selected;

            return (
              <div key={item.id} className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={() => toggleItem(item.id, item)}
                    className="mt-1 rounded border-border text-primary focus:ring-primary w-4 h-4"
                  />
                  <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        Gorsel
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} adet x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(item.total)}
                  </div>
                </div>

                {/* Seçildiyse — miktar ve kalem nedeni */}
                {isSelected && (
                  <div className="ml-7 mt-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-muted-foreground">Adet:</label>
                      <select
                        value={sel.quantity}
                        onChange={(e) => updateItemQty(item.id, parseInt(e.target.value))}
                        className="text-sm border border-border rounded px-2 py-1"
                      >
                        {Array.from({ length: item.quantity }, (_, i) => i + 1).map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Urun icin ozel not (opsiyonel)"
                      value={sel.reason}
                      onChange={(e) => updateItemReason(item.id, e.target.value)}
                      className="w-full text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Iade Nedeni */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-2">
            Iade Nedeni <span className="text-danger">*</span>
          </label>
          <select
            value={generalReason}
            onChange={(e) => setGeneralReason(e.target.value)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Seciniz</option>
            {RETURN_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-2">
            Ek Not (Opsiyonel)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Iade ile ilgili eklemek istediginiz notunuz..."
            className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>

      {/* Ozet ve Gonder */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Secili Urun</span>
          <span className="font-medium">{selectedCount} adet</span>
        </div>
        <div className="flex justify-between text-base font-bold border-t border-border pt-2">
          <span>Tahmini Iade Tutari</span>
          <span className="text-primary">{formatCurrency(refundAmount)}</span>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || selectedCount === 0}
        className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Talep Olusturuluyor..." : "Iade Talebi Olustur"}
      </button>
    </div>
  );
}
