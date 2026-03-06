"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  useProductList,
  useFilterOptions,
  type ProductListItem,
} from "@/hooks/useProductList";
import { formatPrice } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import BulkActionBar from "./BulkActionBar";
import BulkUpdateModal from "./BulkUpdateModal";
import BulkPriceModal from "./BulkPriceModal";

export default function ProductListClient() {
  const queryClient = useQueryClient();

  // Filtre state'leri
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Secim state'i
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toast state'i
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Modal state'leri
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateModalMode, setUpdateModalMode] = useState<"category" | "stock">("category");
  const [priceModalOpen, setPriceModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtre degisikliklerinde sayfa sifirla
  const resetPage = useCallback(() => setPage(1), []);

  // Data fetch
  const { data, isLoading, isFetching } = useProductList({
    page,
    limit,
    search: debouncedSearch,
    categoryId,
    brandId,
    isActive,
  });

  const { categories, brands } = useFilterOptions();

  const products = data?.products || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Secim fonksiyonlari
  const currentPageIds = products.map((p) => p.id);
  const allCurrentSelected = currentPageIds.every((id) => selectedIds.has(id));

  function toggleSelectAll() {
    const next = new Set(selectedIds);
    if (allCurrentSelected && currentPageIds.length > 0) {
      currentPageIds.forEach((id) => next.delete(id));
    } else {
      currentPageIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  // Tekli silme
  async function handleDelete(product: ProductListItem) {
    if (
      !confirm(`"${product.name}" urununu silmek istediginize emin misiniz?`)
    )
      return;
    const res = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setToast({ message: "Urun silindi.", type: "success" });
    } else {
      setToast({ message: "Silme islemi basarisiz.", type: "error" });
    }
  }

  // Sayfalama render
  function renderPagination() {
    if (pagination.totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    const tp = pagination.totalPages;
    const cp = pagination.page;

    pages.push(1);
    if (cp > 3) pages.push("...");
    for (
      let i = Math.max(2, cp - 1);
      i <= Math.min(tp - 1, cp + 1);
      i++
    ) {
      pages.push(i);
    }
    if (cp < tp - 2) pages.push("...");
    if (tp > 1) pages.push(tp);

    return (
      <div className="flex items-center justify-center gap-1 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={cp === 1}
          className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors"
        >
          Onceki
        </button>
        {pages.map((p, i) =>
          typeof p === "string" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                p === cp
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setPage((p) => Math.min(tp, p + 1))}
          disabled={cp === tp}
          className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors"
        >
          Sonraki
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Arama + Filtreler */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Urun adi veya SKU ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              resetPage();
            }}
            className="border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm"
          >
            <option value="">Tum Kategoriler</option>
            {(categories.data || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              resetPage();
            }}
            className="border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm"
          >
            <option value="">Tum Markalar</option>
            {(brands.data || []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              resetPage();
            }}
            className="border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm"
          >
            <option value="">Tum Durumlar</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </div>
      </div>

      {/* Sonuc Sayisi + Sayfa Boyutu + Hizli Linkler */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground flex items-center gap-3">
          <span>{pagination.total} urun bulundu</span>
          <Link
            href="/admin/urunler/toplu-guncelle"
            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            📊 Toplu Fiyat/Stok
          </Link>
          {selectedIds.size > 0 && (
            <span className="ml-2 text-primary font-medium">
              ({selectedIds.size} secili)
            </span>
          )}
          {isFetching && !isLoading && (
            <span className="ml-2 text-muted-foreground">Yukleniyor...</span>
          )}
        </div>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="border border-border rounded-lg px-2 py-1 bg-muted text-foreground text-sm"
        >
          <option value={20}>20 / sayfa</option>
          <option value={50}>50 / sayfa</option>
          <option value={100}>100 / sayfa</option>
        </select>
      </div>

      {/* Tablo */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Yukleniyor...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">
            {debouncedSearch || categoryId || brandId || isActive
              ? "Filtrelere uygun urun bulunamadi."
              : "Henuz urun eklenmemis."}
          </p>
          {!debouncedSearch && !categoryId && !brandId && !isActive && (
            <Link
              href="/admin/urunler/yeni"
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              Ilk urunu olusturun
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allCurrentSelected && currentPageIds.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Urun
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Kategori
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Fiyat
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  Stok
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  Durum
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Islemler
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={`border-b border-border hover:bg-muted/50 ${
                    selectedIds.has(product.id) ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].alt || product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          Yok
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        {product.brand && (
                          <p className="text-xs text-muted-foreground">
                            {product.brand.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {product.sku || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {product.category?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-sm font-medium ${
                        product.stock <= 0
                          ? "text-danger"
                          : product.stock <= 5
                          ? "text-warning"
                          : "text-success"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        product.isActive ? "bg-success" : "bg-danger"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/urunler/${product.id}`}
                        className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
                      >
                        Duzenle
                      </Link>
                      <button
                        onClick={() => handleDelete(product)}
                        className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sayfalama */}
      {renderPagination()}

      {/* Toplu Islem Cubugu */}
      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds(new Set())}
        onToast={(msg, type) => setToast({ message: msg, type })}
        onOpenUpdateModal={(mode) => {
          setUpdateModalMode(mode);
          setUpdateModalOpen(true);
        }}
        onOpenPriceModal={() => setPriceModalOpen(true)}
        currentFilters={{
          search: debouncedSearch,
          categoryId,
          brandId,
          isActive,
        }}
      />

      {/* Toplu Guncelleme Modal */}
      <BulkUpdateModal
        open={updateModalOpen}
        mode={updateModalMode}
        selectedIds={Array.from(selectedIds)}
        onClose={() => setUpdateModalOpen(false)}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          setSelectedIds(new Set());
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      {/* Toplu Fiyat Guncelleme Modal */}
      <BulkPriceModal
        open={priceModalOpen}
        selectedIds={Array.from(selectedIds)}
        onClose={() => setPriceModalOpen(false)}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          setSelectedIds(new Set());
          setPriceModalOpen(false);
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />
    </div>
  );
}
