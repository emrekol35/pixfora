"use client";

import { useState, useEffect } from "react";

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  totalQuantity: number;
  totalRevenue: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
  }).format(amount);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

export default function ProductReport() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductData[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch("/api/reports/products?limit=30");
        if (!res.ok) throw new Error("Veri alinamadi");
        const json = await res.json();
        setProducts(json.products || []);
      } catch (error) {
        console.error("Product report fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const top10 = products.slice(0, 10);
  const maxQuantity =
    top10.length > 0 ? Math.max(...top10.map((p) => p.totalQuantity)) : 0;

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Yukleniyor...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
        Henuz urun satis verisi bulunamadi.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">En Cok Satan Urunler</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground w-12">
                  #
                </th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                  Urun
                </th>
                <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                  Satilan Adet
                </th>
                <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                  Toplam Gelir (TL)
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr
                  key={product.id}
                  className="border-b border-border hover:bg-muted transition-colors"
                >
                  <td className="px-6 py-3 text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-6 py-3 font-medium">{product.name}</td>
                  <td className="px-6 py-3 text-right">
                    {product.totalQuantity.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {formatCurrency(product.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart - Top 10 by Quantity */}
      {top10.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            En Cok Satan 10 Urun (Adet)
          </h2>
          <div className="space-y-3">
            {top10.map((product) => {
              const widthPercent =
                maxQuantity > 0
                  ? (product.totalQuantity / maxQuantity) * 100
                  : 0;
              return (
                <div key={product.id} className="flex items-center gap-3">
                  <span
                    className="text-xs text-muted-foreground w-32 shrink-0 text-right truncate"
                    title={product.name}
                  >
                    {truncate(product.name, 20)}
                  </span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary rounded transition-all duration-300"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-12 shrink-0 text-right">
                    {product.totalQuantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
