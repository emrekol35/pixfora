import Link from "next/link";
import ProductListClient from "./ProductListClient";

export default function ProductsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Urunler</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/urunler/import"
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
          >
            CSV Aktar
          </Link>
          <Link
            href="/admin/urunler/yeni"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            + Yeni Urun
          </Link>
        </div>
      </div>
      <ProductListClient />
    </div>
  );
}
