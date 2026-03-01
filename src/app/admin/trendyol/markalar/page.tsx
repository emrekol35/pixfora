"use client";

import { useState, useEffect, useCallback } from "react";

interface TrendyolBrandItem {
  id: number;
  name: string;
  localBrandId: string | null;
  localBrand: { id: string; name: string; slug: string } | null;
}

interface LocalBrand { id: string; name: string; slug: string; }

export default function TrendyolBrandsPage() {
  const [brands, setBrands] = useState<TrendyolBrandItem[]>([]);
  const [localBrands, setLocalBrands] = useState<LocalBrand[]>([]);
  const [total, setTotal] = useState(0);
  const [mapped, setMapped] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/marketplace/trendyol/brands?${params}`);
      const data = await res.json();
      setBrands(data.brands || []);
      setTotal(data.total || 0);
      setMapped(data.mapped || 0);
    } catch {} finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  useEffect(() => {
    fetch("/api/brands").then((r) => r.json()).then((data) => {
      setLocalBrands(Array.isArray(data) ? data : data.brands || []);
    }).catch(() => {});
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/marketplace/trendyol/brands", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Senkronizasyon başarısız");
      } else {
        alert(data.message || "Senkronizasyon tamamlandı");
        fetchBrands();
      }
    } catch { alert("Senkronizasyon hatası — bağlantı zaman aşımına uğramış olabilir"); } finally { setSyncing(false); }
  }

  async function handleAutoMatch() {
    setAutoMatching(true);
    try {
      const res = await fetch("/api/admin/marketplace/trendyol/brands/map", { method: "POST" });
      const data = await res.json();
      alert(data.message || `${data.matched} marka eşleştirildi`);
      fetchBrands();
    } catch { alert("Otomatik eşleştirme hatası"); } finally { setAutoMatching(false); }
  }

  async function handleMap(trendyolBrandId: number, localBrandId: string | null) {
    try {
      await fetch("/api/admin/marketplace/trendyol/brands/map", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: [{ trendyolBrandId, localBrandId: localBrandId || null }] }),
      });
      fetchBrands();
    } catch { alert("Eşleştirme hatası"); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Marka Eşleştirme</h1>
          <p className="text-muted-foreground mt-1">Toplam: {total} | Eşleşmiş: {mapped}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAutoMatch} disabled={autoMatching}
            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
            {autoMatching ? "Eşleştiriliyor..." : "Otomatik Eşleştir"}
          </button>
          <button onClick={handleSync} disabled={syncing}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
            {syncing ? "Senkronize Ediliyor..." : "Markaları Senkronize Et"}
          </button>
        </div>
      </div>

      <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        placeholder="Marka ara..." className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">ID</th>
              <th className="text-left p-3 font-medium">Trendyol Marka</th>
              <th className="text-left p-3 font-medium">Yerel Marka</th>
              <th className="text-center p-3 font-medium w-20">Durum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Yükleniyor...</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">
                {total === 0 ? 'Marka bulunamadı. Önce "Markaları Senkronize Et" butonuna tıklayın.' : "Sonuç bulunamadı"}
              </td></tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3 text-muted-foreground">{brand.id}</td>
                  <td className="p-3 font-medium">{brand.name}</td>
                  <td className="p-3">
                    <select value={brand.localBrandId || ""} onChange={(e) => handleMap(brand.id, e.target.value || null)}
                      className="w-full px-2 py-1 border border-border rounded bg-background text-xs">
                      <option value="">— Eşleştirilmemiş —</option>
                      {localBrands.map((lb) => (
                        <option key={lb.id} value={lb.id}>{lb.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    {brand.localBrandId ? (
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">✓</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">Önceki</button>
          <span className="px-3 py-1 text-sm text-muted-foreground">Sayfa {page + 1} / {Math.ceil(total / 50)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * 50 >= total}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">Sonraki</button>
        </div>
      )}
    </div>
  );
}
