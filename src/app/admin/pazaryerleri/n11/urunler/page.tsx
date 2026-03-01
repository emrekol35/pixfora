"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
  n11Product: {
    id: string;
    syncStatus: string;
    n11CategoryId: number | null;
    brandName: string | null;
    lastSyncedAt: string | null;
    lastError: string | null;
    n11ProductId: number | null;
    stockCode: string | null;
  } | null;
}

interface N11Category {
  id: number;
  name: string;
  path: string | null;
  leaf: boolean;
}

export default function N11ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  // Toplu yapılandırma modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<number | null>(null);
  const [bulkBrandName, setBulkBrandName] = useState("");
  const [selectedCatName, setSelectedCatName] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);

  // Kategori arama
  const [catSearch, setCatSearch] = useState("");
  const [n11Categories, setN11Categories] = useState<N11Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const catTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (search) params.set("search", search);
      if (syncStatus) params.set("syncStatus", syncStatus);
      const res = await fetch(`/api/admin/marketplace/n11/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }, [search, syncStatus, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounced kategori arama
  useEffect(() => {
    if (catTimerRef.current) clearTimeout(catTimerRef.current);
    if (!catSearch || catSearch.length < 2) {
      setN11Categories([]);
      return;
    }
    setCatLoading(true);
    catTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/marketplace/n11/categories?search=${encodeURIComponent(catSearch)}&all=true&leafOnly=true`);
        const data = await res.json();
        setN11Categories(
          (data.categories || []).map((c: any) => ({ id: c.id, name: c.name, path: c.path, leaf: c.leaf }))
        );
      } catch { setN11Categories([]); }
      finally { setCatLoading(false); }
    }, 400);
    return () => { if (catTimerRef.current) clearTimeout(catTimerRef.current); };
  }, [catSearch]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  }

  async function handleExport() {
    if (selected.size === 0) { alert("Lütfen ürün seçin"); return; }
    setExporting(true);
    try {
      const res = await fetch("/api/admin/marketplace/n11/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `${data.productCount} ürün gönderildi`);
        setSelected(new Set());
        fetchProducts();
      } else {
        alert(data.error || "Aktarım hatası");
      }
    } catch { alert("Aktarım hatası"); } finally { setExporting(false); }
  }

  async function handleBulkConfigure() {
    if (!bulkCategoryId || !bulkBrandName.trim()) {
      alert("Lütfen kategori ve marka seçin");
      return;
    }
    setSavingBulk(true);
    try {
      const res = await fetch("/api/admin/marketplace/n11/products/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: Array.from(selected),
          n11CategoryId: bulkCategoryId,
          brandName: bulkBrandName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Yapılandırma kaydedildi");
        setShowBulkModal(false);
        setBulkCategoryId(null);
        setBulkBrandName("");
        setSelectedCatName("");
        setCatSearch("");
        fetchProducts();
      } else { alert(data.error || "Yapılandırma hatası"); }
    } catch { alert("Yapılandırma hatası"); } finally { setSavingBulk(false); }
  }

  function getStatusBadge(np: ProductItem["n11Product"]) {
    if (!np) return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Yapılandırılmamış</span>;
    const colors: Record<string, string> = {
      SYNCED: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      FAILED: "bg-red-100 text-red-700",
      NOT_SYNCED: "bg-blue-100 text-blue-700",
    };
    const labels: Record<string, string> = {
      SYNCED: "Senkronize",
      PENDING: "Bekliyor",
      FAILED: "Başarısız",
      NOT_SYNCED: "Hazır",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${colors[np.syncStatus] || "bg-gray-100 text-gray-500"}`}>
        {labels[np.syncStatus] || np.syncStatus}
      </span>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">N11 Ürünleri</h1>
          <p className="text-muted-foreground mt-1">Toplam: {total} ürün</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <>
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
              >
                Toplu Yapılandır ({selected.size})
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
              >
                {exporting ? "Aktarılıyor..." : `N11'e Aktar (${selected.size})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Ürün ara..."
          className="flex-1 min-w-48 px-3 py-2 border border-border rounded-lg bg-background text-sm"
        />
        <select
          value={syncStatus}
          onChange={(e) => { setSyncStatus(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
        >
          <option value="">Tüm Durumlar</option>
          <option value="NOT_CONFIGURED">Yapılandırılmamış</option>
          <option value="NOT_SYNCED">Hazır (Aktarılmadı)</option>
          <option value="PENDING">Bekliyor</option>
          <option value="SYNCED">Senkronize</option>
          <option value="FAILED">Başarısız</option>
        </select>
      </div>

      {/* Tablo */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 w-10">
                <input type="checkbox" checked={selected.size === products.length && products.length > 0}
                  onChange={toggleAll} className="w-4 h-4" />
              </th>
              <th className="text-left p-3 font-medium">Ürün</th>
              <th className="text-left p-3 font-medium">SKU</th>
              <th className="text-right p-3 font-medium">Fiyat</th>
              <th className="text-right p-3 font-medium">Stok</th>
              <th className="text-center p-3 font-medium">N11 Durumu</th>
              <th className="text-left p-3 font-medium">N11 Kategori/Marka</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Yükleniyor...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Ürün bulunamadı</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)} className="w-4 h-4" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.images[0] && (
                        <img src={p.images[0].url} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <div className="font-medium truncate max-w-xs">{p.name}</div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{p.sku || "\u2014"}</td>
                  <td className="p-3 text-right">{p.price.toFixed(2)} \u20BA</td>
                  <td className="p-3 text-right">{p.stock}</td>
                  <td className="p-3 text-center">{getStatusBadge(p.n11Product)}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {p.n11Product?.n11CategoryId
                      ? `Kat: ${p.n11Product.n11CategoryId}`
                      : "\u2014"}
                    {p.n11Product?.brandName && (
                      <> / Mrk: {p.n11Product.brandName}</>
                    )}
                    {p.n11Product?.lastError && (
                      <div className="text-red-500 mt-1 truncate max-w-xs" title={p.n11Product.lastError}>
                        &#9888; {p.n11Product.lastError}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">Önceki</button>
          <span className="px-3 py-1 text-sm text-muted-foreground">Sayfa {page + 1} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * 20 >= total}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">Sonraki</button>
        </div>
      )}

      {/* Toplu Yapılandırma Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">Toplu N11 Yapılandırması</h3>
            <p className="text-sm text-muted-foreground">{selected.size} ürün seçili</p>

            {/* Kategori Arama */}
            <div>
              <label className="block text-sm font-medium mb-1">N11 Kategorisi</label>
              {selectedCatName && (
                <div className="mb-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm flex justify-between items-center">
                  <span>{selectedCatName}</span>
                  <button onClick={() => { setBulkCategoryId(null); setSelectedCatName(""); }}
                    className="text-primary hover:text-primary/70">&#10005;</button>
                </div>
              )}
              <input
                type="text" value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Kategori ara (min 2 karakter)..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
              />
              {catLoading && <p className="text-xs text-muted-foreground mt-1">Aranıyor...</p>}
              {n11Categories.length > 0 && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto mt-1">
                  {n11Categories.slice(0, 100).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => { setBulkCategoryId(c.id); setSelectedCatName(c.path || c.name); setN11Categories([]); setCatSearch(""); }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted/60 ${
                        bulkCategoryId === c.id ? "bg-primary/10 text-primary font-medium" : ""
                      }`}
                    >
                      <div>{c.name}</div>
                      {c.path && <div className="text-xs text-muted-foreground">{c.path}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Marka */}
            <div>
              <label className="block text-sm font-medium mb-1">Marka Adı</label>
              <input
                type="text" value={bulkBrandName}
                onChange={(e) => setBulkBrandName(e.target.value)}
                placeholder="Marka adını yazın..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                N11&apos;de marka, ürün özelliği (attribute) olarak gönderilir.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowBulkModal(false); setCatSearch(""); setN11Categories([]); }}
                className="px-4 py-2 border border-border rounded-lg text-sm">İptal</button>
              <button
                onClick={handleBulkConfigure}
                disabled={savingBulk || !bulkCategoryId || !bulkBrandName.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50"
              >
                {savingBulk ? "Kaydediliyor..." : "Kaydet Yapılandır"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
