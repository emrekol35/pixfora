"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  images: { url: string; alt: string | null }[];
  _count: { variants: number };
}

export default function ProductList({ products }: { products: Product[] }) {
  const router = useRouter();

  async function handleDelete(product: Product) {
    if (!confirm(`"${product.name}" urununu silmek istediginize emin misiniz?`))
      return;

    const res = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  if (products.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz urun eklenmemis.</p>
        <Link
          href="/admin/urunler/yeni"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Ilk urunu olusturun
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
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
                className="border-b border-border hover:bg-muted/50"
              >
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

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        {products.map((product) => (
          <div key={product.id} className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              {product.images[0] ? (
                <img
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  className="w-14 h-14 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                  Yok
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.name}</p>
                {product.brand && (
                  <p className="text-xs text-muted-foreground">{product.brand.name}</p>
                )}
                {product.category && (
                  <p className="text-xs text-muted-foreground">{product.category.name}</p>
                )}
              </div>
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                  product.isActive ? "bg-success" : "bg-danger"
                }`}
              />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold">{formatPrice(product.price)}</span>
              <span className="text-muted-foreground">SKU: {product.sku || "-"}</span>
              <span
                className={`font-medium ${
                  product.stock <= 0
                    ? "text-danger"
                    : product.stock <= 5
                    ? "text-warning"
                    : "text-success"
                }`}
              >
                Stok: {product.stock}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/urunler/${product.id}`}
                className="flex-1 text-center px-3 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                Duzenle
              </Link>
              <button
                onClick={() => handleDelete(product)}
                className="px-3 py-2 text-sm bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
