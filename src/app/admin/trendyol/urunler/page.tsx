"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TrendyolProductInfo {
  id: string;
  syncStatus: string;
  trendyolCategoryId: number | null;
  trendyolBrandId: number | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  batchRequestId: string | null;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  stock: number;
  images: { url: string }[];
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  trendyolProduct: TrendyolProductInfo | null;
}

interface TrendyolCat { id: number; name: string; path: string | null; }
interface TrendyolBrand { id: number; name: string; }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SYNCED: { label: "Senkronize", color: "bg-green-100 text-green-700" },
  PENDING: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-700" },
  FAILED: { label: "Basarisiz", color: "bg-red-100 text-red-700" },
  NOT_SYNCED: { label: "Hazir", color: "bg-blue-100 text-blue-700" },
};

export default function TrendyolProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncFilter, setSyncFilter] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState("");

  // Trendyol kategori/marka arama sonuçları
  const [trendyolCategories, setTrendyolCategories] = useState<TrendyolCat[]>([]);
  const [trendyolBrands, setTrendyolBrands] = useState<TrendyolBrand[]>([]);
  const [catSearch, setCatSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const catTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seçilen kategori/marka bilgisi (adını göstermek için)
  const [selectedCatName, setSelectedCatName] = useState("");
  const [selectedBrandName, setSelectedBrandName] = useState("");

  // Toplu yapılandırma modal
  const [showBulkConfig, setShowBulkConfig] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<number | null>(null);
  const [bulkBrandId, setBulkBrandId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (search) params.set("search", search);
      if (syncFilter) params.set("syncStatus", syncFilter);
      const res = await fetch(`/api/admin/marketplace/trendyol/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, syncFilter, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounced kategori arama
  useEffect(() => {
    if (catTimerRef.current) clearTimeout(catTimerRef.current);
    if (!catSearch || catSearch.length < 2) {
      setTrendyolCategories([]);
      return;
    }
    setCatLoading(true);
    catTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/marketplace/trendyol/categories?all=true&search=${encodeURIComponent(catSearch)}`);
        const data = await res.json();
        setTrendyolCategories(
          (data.categories || []).map((c: TrendyolCat & { children?: unknown[] }) => ({
            id: c.id, name: c.name, path: c.path,
          }))
        );
      } catch {
        setTrendyolCategories([]);
      } finally {
        setCatLoading(false);
      }
    }, 400);
    return () => { if (catTimerRef.current) clearTimeout(catTimerRef.current); };
  }, [catSearch]);

  // Debounced marka arama
  useEffect(() => {
    if (brandTimerRef.current) clearTimeout(brandTimerRef.current);
    if (!brandSearch || brandSearch.length < 2) {
      setTrendyolBrands([]);
      return;
    }
    setBrandLoading(true);
    brandTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/marketplace/trendyol/brands?search=${encodeURIComponent(brandSearch)}&size=50`);
        const data = await res.json();
        setTrendyolBrands(
          (data.brands || []).map((b: TrendyolBrand) => ({ id: b.id, name: b.name }))
        );
      } catch {
        setTrendyolBrands([]);
      } finally {
        setBrandLoading(false);
      }
    }, 400);
    return () => { if (brandTimerRef.current) clearTimeout(brandTimerRef.current); };
  }, [brandSearch]);

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  }

  // Tek ürüne kategori/marka ata
  async function handleConfigure(productId: string, trendyolCategoryId: number | null, trendyolBrandId: number | null) {
    try {
      await fetch("/api/admin/marketplace/trendyol/products/configure", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, trendyolCategoryId, trendyolBrandId }),
      });
      fetchProducts();
    } catch {
      alert("Yapilandirma hatasi");
    }
  }

  // Toplu yapılandırma
  async function handleBulkConfigure() {
    if (selected.size === 0 || !bulkCategoryId || !bulkBrandId) {
      alert("Urun secin ve kategori/marka belirleyin");
      return;
    }
    setActionLoading("bulkConfig");
    try {
      const res = await fetch("/api/admin/marketplace/trendyol/products/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selected), trendyolCategoryId: bulkCategoryId, trendyolBrandId: bulkBrandId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Yapilandirildi");
        setShowBulkConfig(false);
        setSelected(new Set());
        fetchProducts();
      } else { alert(data.error); }
    } catch { alert("Hata"); } finally { setActionLoading(""); }
  }

  // Seçili ürünleri Trendyol'a aktar
  async function handleExport() {
    if (selected.size === 0) { alert("Urun secin"); return; }
    setActionLoading("export");
    try {
      const res = await fetch("/api/admin/marketplace/trendyol/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.itemCount} urun Trendyol'a gonderildi.`);
        setSelected(new Set());
        fetchProducts();
      } else { alert(data.error || "Aktarim hatasi"); }
    } catch { alert("Aktarim hatasi"); } finally { setActionLoading(""); }
  }

  // Fiyat/Stok güncelle
  async function handlePriceStockUpdate() {
    setActionLoading("priceStock");
    try {
      const res = await fetch("/api/admin/marketplace/trendyol/products/price-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selected.size > 0 ? Array.from(selected) : undefined }),
      });
      const data = await res.json();
      if (res.ok) { alert(`${data.count} urun guncellendi.`); }
      else { alert(data.error); }
    } catch { alert("Guncelleme hatasi"); } finally { setActionLoading(""); }
  }

  // Batch durum kontrol
  async function handleCheckBatch() {
    const pending = products.filter((p) => p.trendyolProduct?.syncStatus === "PENDING" && p.trendyolProduct?.batchRequestId);
    const batchIds = [...new Set(pending.map((p) => p.trendyolProduct!.batchRequestId!))];
    if (batchIds.length === 0) { alert("Bekleyen batch yok"); return; }
    setActionLoading("batch");
    try {
      for (const batchId of batchIds) {
        await fetch("/api/admin/marketplace/trendyol/products/batch-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchRequestId: batchId }),
        });
      }
      alert("Batch durumlari kontrol edildi");
      fetchProducts();
    } catch { alert("Batch kontrol hatasi"); } finally { setActionLoading(""); }
  }

  function getStatus(p: ProductItem) {
    if (!p.trendyolProduct) return { label: "Yapilandirilmamis", color: "bg-gray-100 text-gray-500" };
    if (!p.trendyolProduct.trendyolCategoryId || !p.trendyolProduct.trendyolBrandId) {
      return { label: "Kategori/Marka Eksik", color: "bg-orange-100 text-orange-700" };
    }
    return STATUS_LABELS[p.trendyolProduct.syncStatus] || STATUS_LABELS.NOT_SYNCED;
  }

  // Artık client-side filtreleme yok, API'den arama yapılıyor

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Trendyol Urun Yonetimi</h1>
          <p className="text-muted-foreground mt-1">{total} urun</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleCheckBatch} disabled={!!actionLoading}
            className="px-3 py-2 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-50">
            {actionLoading === "batch" ? "Kontrol..." : "Batch Kontrol"}
          </button>
          <button onClick={handlePriceStockUpdate} disabled={!!actionLoading}
            className="px-3 py-2 border border-border rounded-lg text-xs hover:bg-muted disabled:opacity-50">
            {actionLoading === "priceStock" ? "Guncelleniyor..." : "Fiyat/Stok Guncelle"}
          </button>
          <button onClick={() => { if (selected.size === 0) { alert("Urun secin"); return; } setShowBulkConfig(true); }}
            disabled={!!actionLoading}
            className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs hover:opacity-90 disabled:opacity-50">
            Toplu Yapilandir ({selected.size})
          </button>
          <button onClick={handleExport} disabled={!!actionLoading || selected.size === 0}
            className="px-3 py-2 bg-primary text-white rounded-lg text-xs hover:opacity-90 disabled:opacity-50">
            {actionLoading === "export" ? "Aktariliyor..." : `Trendyol'a Aktar (${selected.size})`}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Urun adi veya SKU ara..."
          className="flex-1 min-w-48 px-3 py-2 border border-border rounded-lg bg-background text-sm" />
        <select value={syncFilter} onChange={(e) => { setSyncFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-border rounded-lg bg-background text-sm">
          <option value="">Tum Urunler</option>
          <option value="NOT_CONFIGURED">Yapilandirilmamis</option>
          <option value="NOT_SYNCED">Hazir (Aktarilmamis)</option>
          <option value="PENDING">Bekliyor</option>
          <option value="SYNCED">Senkronize</option>
          <option value="FAILED">Basarisiz</option>
        </select>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <strong>Urun ekleme adimlar:</strong> 1) Urunleri secin → 2) "Toplu Yapilandir" ile Trendyol kategorisi ve markasi atayin → 3) "Trendyol&apos;a Aktar" ile gonderin
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 w-10">
                <input type="checkbox" checked={selected.size === products.length && products.length > 0}
                  onChange={toggleSelectAll} className="w-4 h-4" />
              </th>
              <th className="text-left p-3 font-medium">Urun</th>
              <th className="text-left p-3 font-medium">Kategori</th>
              <th className="text-right p-3 font-medium">Fiyat</th>
              <th className="text-right p-3 font-medium">Stok</th>
              <th className="text-center p-3 font-medium">Trendyol Durumu</th>
              <th className="text-left p-3 font-medium">Trendyol Kat./Marka</th>
              <th className="text-left p-3 font-medium w-36">Hata</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Yukleniyor...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Urun bulunamadi</td></tr>
            ) : (
              products.map((p) => {
                const st = getStatus(p);
                const tp = p.trendyolProduct;
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)} className="w-4 h-4" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {p.images[0] && <img src={p.images[0].url} alt="" className="w-8 h-8 rounded object-cover" />}
                        <div>
                          <div className="font-medium truncate max-w-[200px]">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.sku || "SKU yok"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{p.category?.name || "—"}</td>
                    <td className="p-3 text-right">{Number(p.price).toFixed(2)} TL</td>
                    <td className="p-3 text-right">{p.stock}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="p-3 text-xs">
                      {tp?.trendyolCategoryId && tp?.trendyolBrandId ? (
                        <span className="text-green-600">Kat: {tp.trendyolCategoryId} / Mrk: {tp.trendyolBrandId}</span>
                      ) : tp ? (
                        <span className="text-orange-600">Eksik</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {tp?.lastError && (
                        <span className="text-xs text-red-600 truncate max-w-[140px] block" title={tp.lastError}>
                          {tp.lastError.substring(0, 50)}...
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

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">Onceki</button>
          <span className="px-3 py-1 text-sm text-muted-foreground">Sayfa {page + 1} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * 20 >= total}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">Sonraki</button>
        </div>
      )}

      {/* Toplu Yapılandırma Modal */}
      {showBulkConfig && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkConfig(false)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Toplu Trendyol Yapilandirma</h2>
            <p className="text-sm text-muted-foreground">{selected.size} urun icin Trendyol kategori ve marka secin.</p>

            {/* Kategori Seç */}
            <div>
              <label className="text-sm font-medium block mb-1">Trendyol Kategorisi</label>
              <input type="text" value={catSearch} onChange={(e) => setCatSearch(e.target.value)}
                placeholder="En az 2 harf yazin... (ornek: tisort)"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mb-1" />
              {catLoading && <p className="text-xs text-muted-foreground">Araniyor...</p>}
              {!catLoading && catSearch.length >= 2 && trendyolCategories.length === 0 && (
                <p className="text-xs text-muted-foreground">Sonuc bulunamadi</p>
              )}
              {trendyolCategories.length > 0 && (
                <select
                  value={bulkCategoryId || ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setBulkCategoryId(id);
                    const cat = trendyolCategories.find((c) => c.id === id);
                    setSelectedCatName(cat ? (cat.path || cat.name) : "");
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                  size={Math.min(trendyolCategories.length, 6)}
                >
                  {trendyolCategories.slice(0, 100).map((c) => (
                    <option key={c.id} value={c.id}>{c.path || c.name}</option>
                  ))}
                </select>
              )}
              {bulkCategoryId && selectedCatName && (
                <p className="text-xs text-green-600 mt-1">✓ Secilen: {selectedCatName}</p>
              )}
            </div>

            {/* Marka Seç */}
            <div>
              <label className="text-sm font-medium block mb-1">Trendyol Markasi</label>
              <input type="text" value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="En az 2 harf yazin... (ornek: lecatte)"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mb-1" />
              {brandLoading && <p className="text-xs text-muted-foreground">Araniyor...</p>}
              {!brandLoading && brandSearch.length >= 2 && trendyolBrands.length === 0 && (
                <p className="text-xs text-muted-foreground">Sonuc bulunamadi</p>
              )}
              {trendyolBrands.length > 0 && (
                <select
                  value={bulkBrandId || ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setBulkBrandId(id);
                    const brand = trendyolBrands.find((b) => b.id === id);
                    setSelectedBrandName(brand ? brand.name : "");
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                  size={Math.min(trendyolBrands.length, 6)}
                >
                  {trendyolBrands.slice(0, 100).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
              {bulkBrandId && selectedBrandName && (
                <p className="text-xs text-green-600 mt-1">✓ Secilen: {selectedBrandName}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowBulkConfig(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Iptal</button>
              <button onClick={handleBulkConfigure}
                disabled={!bulkCategoryId || !bulkBrandId || actionLoading === "bulkConfig"}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
                {actionLoading === "bulkConfig" ? "Kaydediliyor..." : "Kaydet ve Yapilandir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
