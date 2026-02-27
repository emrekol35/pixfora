"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFilterOptions } from "@/hooks/useProductList";

interface BulkUpdateModalProps {
  open: boolean;
  mode: "category" | "stock";
  selectedIds: string[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function BulkUpdateModal({
  open,
  mode,
  selectedIds,
  onClose,
  onSuccess,
  onError,
}: BulkUpdateModalProps) {
  const queryClient = useQueryClient();
  const { categories } = useFilterOptions();
  const [loading, setLoading] = useState(false);

  // Kategori state
  const [selectedCategory, setSelectedCategory] = useState("");

  // Stok state
  const [stockAction, setStockAction] = useState<"set" | "increase" | "decrease">("set");
  const [stockValue, setStockValue] = useState("");

  if (!open) return null;

  async function handleSubmit() {
    setLoading(true);
    try {
      let updateData;

      if (mode === "category") {
        if (!selectedCategory) {
          onError("Lutfen bir kategori secin.");
          setLoading(false);
          return;
        }
        updateData = { field: "categoryId", value: selectedCategory };
      } else {
        if (!stockValue || isNaN(Number(stockValue)) || Number(stockValue) < 0) {
          onError("Lutfen gecerli bir stok degeri girin.");
          setLoading(false);
          return;
        }
        updateData = {
          field: "stock",
          stockAction,
          stockValue: Number(stockValue),
        };
      }

      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          ids: selectedIds,
          updateData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Guncelleme basarisiz");

      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onSuccess(data.message || "Guncelleme tamamlandi.");
      onClose();
    } catch (err) {
      onError((err as Error).message || "Bir hata olustu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {mode === "category" ? "Kategori Degistir" : "Stok Guncelle"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {selectedIds.length} urun icin islem yapilacak.
        </p>

        {mode === "category" ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              Yeni Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm"
            >
              <option value="">Kategori Secin</option>
              {(categories.data || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Islem Tipi
              </label>
              <div className="flex gap-3">
                {(
                  [
                    { value: "set", label: "Sabit Deger Ata" },
                    { value: "increase", label: "Artir" },
                    { value: "decrease", label: "Azalt" },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="stockAction"
                      value={opt.value}
                      checked={stockAction === opt.value}
                      onChange={() => setStockAction(opt.value)}
                      className="accent-primary"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Deger
              </label>
              <input
                type="number"
                min="0"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                placeholder="0"
                className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Iptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Guncelleniyor..." : "Uygula"}
          </button>
        </div>
      </div>
    </div>
  );
}
