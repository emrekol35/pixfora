"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";

interface PricePreviewItem {
  id: string;
  name: string;
  price: number;
}

interface BulkPriceModalProps {
  open: boolean;
  selectedIds: string[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

type UpdateType = "fixed" | "percentage";
type Direction = "increase" | "decrease";
type Rounding = "none" | "0.01" | "0.99" | "integer";

function applyRounding(value: number, rounding: Rounding): number {
  if (rounding === "none") return Math.round(value * 100) / 100;
  if (rounding === "integer") return Math.round(value);
  if (rounding === "0.99") return Math.floor(value) + 0.99;
  if (rounding === "0.01") return Math.floor(value) + 0.01;
  return Math.round(value * 100) / 100;
}

function calculateNewPrice(
  currentPrice: number,
  updateType: UpdateType,
  direction: Direction,
  amount: number,
  rounding: Rounding
): number {
  let newPrice: number;

  if (updateType === "fixed") {
    newPrice =
      direction === "increase"
        ? currentPrice + amount
        : currentPrice - amount;
  } else {
    const change = currentPrice * (amount / 100);
    newPrice =
      direction === "increase"
        ? currentPrice + change
        : currentPrice - change;
  }

  newPrice = Math.max(0, newPrice);
  return applyRounding(newPrice, rounding);
}

export default function BulkPriceModal({
  open,
  selectedIds,
  onClose,
  onSuccess,
  onError,
}: BulkPriceModalProps) {
  const queryClient = useQueryClient();

  const [updateType, setUpdateType] = useState<UpdateType>("percentage");
  const [direction, setDirection] = useState<Direction>("increase");
  const [amount, setAmount] = useState<string>("");
  const [rounding, setRounding] = useState<Rounding>("none");
  const [products, setProducts] = useState<PricePreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  // Urun fiyatlarini getir
  useEffect(() => {
    if (!open || selectedIds.length === 0) return;

    async function fetchPrices() {
      setLoading(true);
      try {
        const res = await fetch("/api/products/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "preview-price",
            ids: selectedIds,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        // devam et
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, [open, selectedIds]);

  // Modal kapaninca sifirla
  useEffect(() => {
    if (!open) {
      setUpdateType("percentage");
      setDirection("increase");
      setAmount("");
      setRounding("none");
      setProducts([]);
    }
  }, [open]);

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0;

  // Onizleme hesapla
  const preview = products.map((p) => ({
    ...p,
    newPrice: isValid
      ? calculateNewPrice(p.price, updateType, direction, numAmount, rounding)
      : p.price,
  }));

  // Toplam degisim
  const totalCurrent = products.reduce((sum, p) => sum + p.price, 0);
  const totalNew = preview.reduce((sum, p) => sum + p.newPrice, 0);
  const totalDiff = totalNew - totalCurrent;

  // Uygula
  async function handleApply() {
    if (!isValid) return;
    setApplying(true);

    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          ids: selectedIds,
          updateData: {
            field: "price",
            type: updateType,
            direction,
            value: numAmount,
            rounding,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fiyat guncelleme basarisiz");

      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onSuccess(data.message || `${selectedIds.length} urunun fiyati guncellendi.`);
      onClose();
    } catch (err) {
      onError((err as Error).message || "Fiyat guncelleme hatasi.");
    } finally {
      setApplying(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Baslik */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Toplu Fiyat Guncelleme ({selectedIds.length} urun)
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Icerik */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Guncelleme Tipi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Guncelleme Tipi
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setUpdateType("percentage")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    updateType === "percentage"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-foreground"
                  }`}
                >
                  Yuzde (%)
                </button>
                <button
                  onClick={() => setUpdateType("fixed")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    updateType === "fixed"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-foreground"
                  }`}
                >
                  Sabit Tutar (₺)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Yon</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDirection("increase")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    direction === "increase"
                      ? "border-green-500 bg-green-500/10 text-green-600"
                      : "border-border bg-muted text-foreground"
                  }`}
                >
                  ↑ Artir
                </button>
                <button
                  onClick={() => setDirection("decrease")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    direction === "decrease"
                      ? "border-red-500 bg-red-500/10 text-red-600"
                      : "border-border bg-muted text-foreground"
                  }`}
                >
                  ↓ Azalt
                </button>
              </div>
            </div>
          </div>

          {/* Deger + Yuvarlama */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Deger {updateType === "percentage" ? "(%)" : "(₺)"}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={updateType === "percentage" ? "orn: 10" : "orn: 50"}
                min="0"
                step={updateType === "percentage" ? "0.1" : "0.01"}
                className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Yuvarlama
              </label>
              <select
                value={rounding}
                onChange={(e) => setRounding(e.target.value as Rounding)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm"
              >
                <option value="none">Yok (2 ondalik)</option>
                <option value="0.01">X.01 (orn: 99.01)</option>
                <option value="0.99">X.99 (orn: 99.99)</option>
                <option value="integer">Tam Sayi (orn: 100)</option>
              </select>
            </div>
          </div>

          {/* Onizleme Tablosu */}
          {loading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Fiyatlar yukleniyor...
            </div>
          ) : products.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Fiyat Onizleme</h3>
                {isValid && (
                  <span
                    className={`text-xs font-medium ${
                      totalDiff >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    Toplam fark: {totalDiff >= 0 ? "+" : ""}
                    {formatPrice(totalDiff)}
                  </span>
                )}
              </div>
              <div className="border border-border rounded-lg overflow-hidden max-h-[250px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Urun
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                        Mevcut Fiyat
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                        Yeni Fiyat
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                        Fark
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p) => {
                      const diff = p.newPrice - p.price;
                      return (
                        <tr
                          key={p.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-3 py-2 truncate max-w-[200px]">
                            {p.name}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatPrice(p.price)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {isValid ? formatPrice(p.newPrice) : "-"}
                          </td>
                          <td
                            className={`px-3 py-2 text-right text-xs font-medium ${
                              diff > 0
                                ? "text-green-600"
                                : diff < 0
                                ? "text-red-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {isValid
                              ? `${diff >= 0 ? "+" : ""}${formatPrice(diff)}`
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Iptal
          </button>
          <button
            onClick={handleApply}
            disabled={!isValid || applying}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {applying
              ? "Uygulanıyor..."
              : `${selectedIds.length} Urune Uygula`}
          </button>
        </div>
      </div>
    </div>
  );
}
