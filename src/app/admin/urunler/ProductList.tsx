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
  );
}
