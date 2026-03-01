"use client";

import { useState, useEffect, useCallback } from "react";

interface TrendyolCategoryItem {
  id: number;
  name: string;
  parentId: number | null;
  path: string | null;
  localCategoryId: string | null;
  localCategory: { id: string; name: string; slug: string } | null;
  children: { id: number; name: string }[];
}

interface LocalCategory {
  id: string;
  name: string;
  slug: string;
}

export default function TrendyolCategoriesPage() {
  const [categories, setCategories] = useState<TrendyolCategoryItem[]>([]);
  const [localCategories, setLocalCategories] = useState<LocalCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [mapped, setMapped] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: number; name: string }[]>([]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (parentId !== null) params.set("parentId", String(parentId));
      const res = await fetch(`/api/admin/marketplace/trendyol/categories?${params}`);
      const data = await res.json();
      setCategories(data.categories || []);
      setTotal(data.total || 0);
      setMapped(data.mapped || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search, parentId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        const flatten = (cats: any[], result: LocalCategory[] = []): LocalCategory[] => {
          for (const c of cats) {
            result.push({ id: c.id, name: c.name, slug: c.slug });
            if (c.children) flatten(c.children, result);
          }
          return result;
        };
        setLocalCategories(flatten(Array.isArray(data) ? data : data.categories || []));
      })
      .catch(() => {});
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/marketplace/trendyol/categories", { method: "POST" });
      const data = await res.json();
      alert(data.message || "Senkronizasyon tamamlandı");
      fetchCategories();
    } catch {
      alert("Senkronizasyon hatası");
    } finally {
      setSyncing(false);
    }
  }

  async function handleMap(trendyolCategoryId: number, localCategoryId: string | null) {
    try {
      await fetch("/api/admin/marketplace/trendyol/categories/map", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mappings: [{ trendyolCategoryId, localCategoryId: localCategoryId || null }],
        }),
      });
      fetchCategories();
    } catch {
      alert("Eşleştirme hatası");
    }
  }

  function navigateToCategory(id: number, name: string) {
    setBreadcrumb((prev) => [...prev, { id, name }]);
    setParentId(id);
    setSearch("");
  }

  function navigateToBreadcrumb(index: number) {
    if (index < 0) {
      setBreadcrumb([]);
      setParentId(null);
    } else {
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);
      setParentId(newBreadcrumb[newBreadcrumb.length - 1].id);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategori Eşleştirme</h1>
          <p className="text-muted-foreground mt-1">
            Toplam: {total} | Eşleşmiş: {mapped}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
        >
          {syncing ? "Senkronize Ediliyor..." : "Kategorileri Senkronize Et"}
        </button>
      </div>

      {/* Arama */}
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setParentId(null); setBreadcrumb([]); }}
        placeholder="Kategori ara..."
        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
      />

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <button onClick={() => navigateToBreadcrumb(-1)} className="hover:text-primary">
            Ana Kategoriler
          </button>
          {breadcrumb.map((bc, i) => (
            <span key={bc.id} className="flex items-center gap-2">
              <span>›</span>
              <button onClick={() => navigateToBreadcrumb(i)} className="hover:text-primary">
                {bc.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tablo */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Trendyol Kategori</th>
              <th className="text-left p-3 font-medium">Alt Kategori</th>
              <th className="text-left p-3 font-medium">Yerel Kategori</th>
              <th className="text-center p-3 font-medium w-20">Durum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Yükleniyor...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">
                {total === 0 ? 'Kategori bulunamadı. Önce "Kategorileri Senkronize Et" butonuna tıklayın.' : "Sonuç bulunamadı"}
              </td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{cat.name}</div>
                    {cat.path && <div className="text-xs text-muted-foreground truncate max-w-xs">{cat.path}</div>}
                  </td>
                  <td className="p-3">
                    {cat.children.length > 0 ? (
                      <button
                        onClick={() => navigateToCategory(cat.id, cat.name)}
                        className="text-primary text-xs hover:underline"
                      >
                        {cat.children.length}+ alt kategori →
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Yaprak</span>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={cat.localCategoryId || ""}
                      onChange={(e) => handleMap(cat.id, e.target.value || null)}
                      className="w-full px-2 py-1 border border-border rounded bg-background text-xs"
                    >
                      <option value="">— Eşleştirilmemiş —</option>
                      {localCategories.map((lc) => (
                        <option key={lc.id} value={lc.id}>{lc.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    {cat.localCategoryId ? (
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
    </div>
  );
}
