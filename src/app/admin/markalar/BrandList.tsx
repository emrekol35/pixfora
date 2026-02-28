"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  isActive: boolean;
  _count?: { products: number };
}

export default function BrandList({ brands }: { brands: Brand[] }) {
  const router = useRouter();

  async function handleDelete(brand: Brand) {
    if (!confirm(`"${brand.name}" markasini silmek istediginize emin misiniz?`)) return;

    const res = await fetch(`/api/brands/${brand.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  if (brands.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz marka eklenmemis.</p>
        <Link href="/admin/markalar/yeni" className="text-primary hover:underline text-sm mt-2 inline-block">
          Ilk markayi olusturun
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
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Marka Adi</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Slug</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Durum</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Urun Sayisi</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{brand.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{brand.slug}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${brand.isActive ? "bg-success" : "bg-danger"}`} />
                </td>
                <td className="px-4 py-3 text-center text-sm">{brand._count?.products ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/markalar/${brand.id}`}
                      className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
                    >
                      Duzenle
                    </Link>
                    <button
                      onClick={() => handleDelete(brand)}
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
        {brands.map((brand) => (
          <div key={brand.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{brand.name}</p>
                <span className={`inline-block w-2 h-2 rounded-full ${brand.isActive ? "bg-success" : "bg-danger"}`} />
              </div>
              <span className="text-xs text-muted-foreground">{brand._count?.products ?? 0} urun</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{brand.slug}</span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/markalar/${brand.id}`}
                  className="px-3 py-1.5 text-xs bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Duzenle
                </Link>
                <button
                  onClick={() => handleDelete(brand)}
                  className="px-3 py-1.5 text-xs bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
