"use client";

import { useState, useEffect, useCallback } from "react";

interface TrendyolProductItem {
  id: string;
  productId: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  batchRequestId: string | null;
  trendyolCategoryId: number | null;
  trendyolBrandId: number | null;
  product: {
    id: string; name: string; sku: string | null; barcode: string | null;
    price: number; comparePrice: number | null; stock: number; isActive: boolean;
    images: { url: string }[];
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SYNCED: { label: "Senkronize", color: "bg-green-100 text-green-700" },
  PENDING: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-700" },
  FAILED: { label: "Başarısız", color: "bg-red-100 text-red-700" },
  NOT_SYNCED: { label: "Senkronize Değil", color: "bg-gray-100 text-gray-600" },
};

export default function TrendyolProductsPage() {
  const [items, setItems] = useState<TrendyolProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (search) params.set("search", search);
      if (syncStatus) params.set("syncStatus", syncStatus);
      const res = await fetch(`/api/admin/marketplace/trendyol/products?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }, [search, syncStatus, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    if (selected.size === items.length) { setSelected(new Set()); }
    else { setSelected(new Set(items.map((i) => i.productId))); }
  }

  async function handleExport() {
    if (selected.size === 0) { alert("Lütfen ürün seçin"); return; }
    setActionLoading("export");
    try {
      const res = await fetch("/api/admin/marketplace/trendyol/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.itemCount} ürün Trendyol'a gönderildi. Batch ID: ${data.batchRequestIds?.[0]}`);
        setSelected(new Set());
        fetchProducts();
      } else { alert(data.error || "Aktarım hatası"); }
    } catch { alert("Aktarım hatası"); } finally { setActionLoading(""); }
  }

  async function handleBulkSync() {
    setActionLoading("bulk");
    try {
      const res = await fetch("/api/admin/marketplace/trendyol/products/bulk-sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.totalProducts} ürün toplu aktarıma gönderildi.`);
        fetchProducts();
      } else { alert(data.error || "Toplu aktarım hatası"); }
    } catch { alert("Toplu aktarım hatası"); } finally { setActionLoading(""); }
  }

  async function handlePriceStockUpdate() {
    const productIds = selected.size > 0 ? Array.from(selected) : undefined;
    setActionLoading("priceStock");
    try {
      const res = await fetch("/api/admin/marketplace/trendyol/products/price-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.count} ürün fiyat/stok güncellemesi gönderildi.`);
      } else { alert(data.error || "Güncelleme hatası"); }
    } catch { alert("Güncelleme hatası"); } finally { setActionLoading(""); }
  }

  async function handleCheckBatch() {
    const batchIds = new Set(items.filter((i) => i.batchRequestId && i.syncStatus === "PENDING").map((i) => i.batchRequestId!));
    if (batchIds.size === 0) { alert("Bekleyen batch bulunamadı"); return; }
    setActionLoading("batch");
    try {
      for (const batchId of batchIds) {
        await fetch("/api/admin/marketplace/trendyol/products/batch-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchRequestId: batchId }),
        });
      }
      alert("Batch durumları kontrol edildi");
      fetchProducts();
    } catch { alert("Batch kontrol hatası"); } finally { setActionLoading(""); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Trendyol Ürün Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Toplam: {total} ürün</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleCheckBatch} disabled={!!actionLoading}
            className="px-3 py-2 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-50">
            {actionLoading === "batch" ? "Kontrol..." : "Batch Kontrol"}
          </button>
          <button onClick={handlePriceStockUpdate} disabled={!!actionLoading}
            className="px-3 py-2 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-50">
            {actionLoading === "priceStock" ? "Güncelleniyor..." : "Fiyat/Stok Güncelle"}
          </button>
          <button onClick={handleExport} disabled={!!actionLoading || selected.size === 0}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:opacity-90 disabled:opacity-50">
            {actionLoading === "export" ? "Aktarılıyor..." : `Seçilenleri Aktar (${selected.size})`}
          </button>
          <button onClick={handleBulkSync} disabled={!!actionLoading}
            className="px-3 py-2 bg-primary text-white rounded-lg text-xs hover:opacity-90 disabled:opacity-50">
            {actionLoading === "bulk" ? "Aktarılıyor..." : "Toplu Aktar"}
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Ürün adı veya SKU ara..." className="flex-1 min-w-48 px-3 py-2 border border-border rounded-lg bg-background text-sm" />
        <select value={syncStatus} onChange={(e) => { setSyncStatus(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-border rounded-lg bg-background text-sm">
          <option value="">Tüm Durumlar</option>
          <option value="SYNCED">Senkronize</option>
          <option value="PENDING">Bekliyor</option>
          <option value="FAILED">Başarısız</option>
          <option value="NOT_SYNCED">Senkronize Değil</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 w-10"><input type="checkbox" checked={selected.size === items.length && items.length > 0}
                onChange={toggleSelectAll} className="w-4 h-4" /></th>
              <th className="text-left p-3 font-medium">Ürün</th>
              <th className="text-left p-3 font-medium">SKU</th>
              <th className="text-right p-3 font-medium">Fiyat</th>
              <th className="text-right p-3 font-medium">Stok</th>
              <th className="text-center p-3 font-medium">Durum</th>
              <th className="text-left p-3 font-medium">Son Sync</th>
              <th className="text-left p-3 font-medium">Hata</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Yükleniyor...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Ürün bulunamadı</td></tr>
            ) : (
              items.map((item) => {
                const st = STATUS_LABELS[item.syncStatus] || STATUS_LABELS.NOT_SYNCED;
                return (
                  <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3"><input type="checkbox" checked={selected.has(item.productId)}
                      onChange={() => toggleSelect(item.productId)} className="w-4 h-4" /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {item.product.images[0] && (
                          <img src={item.product.images[0].url} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="font-medium truncate max-w-xs">{item.product.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{item.product.sku || "—"}</td>
                    <td className="p-3 text-right">{item.product.price.toFixed(2)} ₺</td>
                    <td className="p-3 text-right">{item.product.stock}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {item.lastSyncedAt ? new Date(item.lastSyncedAt).toLocaleString("tr-TR") : "—"}
                    </td>
                    <td className="p-3">
                      {item.lastError && (
                        <span className="text-xs text-red-600 truncate max-w-xs block" title={item.lastError}>
                          {item.lastError.substring(0, 60)}{item.lastError.length > 60 ? "..." : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">Önceki</button>
          <span className="px-3 py-1 text-sm text-muted-foreground">Sayfa {page + 1} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * 20 >= total}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">Sonraki</button>
        </div>
      )}
    </div>
  );
}
