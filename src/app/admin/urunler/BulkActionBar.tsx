"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface BulkActionBarProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
  onOpenUpdateModal: (mode: "category" | "stock") => void;
  onOpenPriceModal: () => void;
  currentFilters: {
    search: string;
    categoryId: string;
    brandId: string;
    isActive: string;
  };
}

export default function BulkActionBar({
  selectedIds,
  onClearSelection,
  onToast,
  onOpenUpdateModal,
  onOpenPriceModal,
  currentFilters,
}: BulkActionBarProps) {
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Disari tiklaninca menu kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ids = Array.from(selectedIds);

  async function callBulkApi(payload: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Islem basarisiz");
      onToast(data.message || "Islem tamamlandi.", "success");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onClearSelection();
    } catch (err) {
      onToast(
        (err as Error).message || "Bir hata olustu.",
        "error"
      );
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }

  // Toplu silme
  async function handleBulkDelete() {
    if (
      !confirm(
        `${ids.length} urunu silmek istediginize emin misiniz? Bu islem geri alinamaz.`
      )
    )
      return;
    await callBulkApi({ action: "delete", ids });
  }

  // Basit toggle guncellemeler
  async function handleToggle(field: string, value: boolean) {
    setMenuOpen(false);
    await callBulkApi({
      action: "update",
      ids,
      updateData: { field, value },
    });
  }

  // Export - secili urunler
  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export", ids }),
      });
      if (!res.ok) throw new Error("Export basarisiz");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `urunler-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      onToast(`${ids.length} urun CSV olarak indirildi.`, "success");
    } catch {
      onToast("Export sirasinda hata olustu.", "error");
    } finally {
      setLoading(false);
    }
  }

  // Export - filtrelenmis tum urunler
  async function handleExportAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export-filtered",
          filters: currentFilters,
        }),
      });
      if (!res.ok) throw new Error("Export basarisiz");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `urunler-tumu-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      onToast("Tum urunler CSV olarak indirildi.", "success");
    } catch {
      onToast("Export sirasinda hata olustu.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (selectedIds.size === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border border-border shadow-xl rounded-xl px-5 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedIds.size} urun secildi
      </span>

      <div className="h-6 w-px bg-border" />

      {/* Toplu Guncelle Dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
        >
          Toplu Guncelle
          <svg
            className={`w-3 h-3 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px] z-50">
            <button
              onClick={() => handleToggle("isActive", true)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Aktif Yap
            </button>
            <button
              onClick={() => handleToggle("isActive", false)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Pasif Yap
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={() => handleToggle("isFeatured", true)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Vitrine Cikar
            </button>
            <button
              onClick={() => handleToggle("isFeatured", false)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Vitrinden Kaldir
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenUpdateModal("category");
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Kategori Degistir
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenPriceModal();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Fiyat Guncelle
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenUpdateModal("stock");
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Stok Guncelle
            </button>
          </div>
        )}
      </div>

      {/* Export butonlari */}
      <button
        onClick={handleExport}
        disabled={loading}
        className="px-3 py-1.5 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
      >
        Secilileri Aktar
      </button>
      <button
        onClick={handleExportAll}
        disabled={loading}
        className="px-3 py-1.5 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
      >
        Tumunu Aktar
      </button>

      {/* Sil */}
      <button
        onClick={handleBulkDelete}
        disabled={loading}
        className="px-3 py-1.5 text-sm bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors disabled:opacity-50"
      >
        Sil
      </button>

      {/* Secimi Temizle */}
      <button
        onClick={onClearSelection}
        className="text-muted-foreground hover:text-foreground transition-colors ml-1"
        title="Secimi Temizle"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
