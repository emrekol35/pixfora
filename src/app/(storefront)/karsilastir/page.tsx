"use client";

import Image from "next/image";
import Link from "next/link";
import { useCompareStore } from "@/store/compare";
import { useCartStore } from "@/store/cart";

export default function ComparePage() {
  const items = useCompareStore((s) => s.items);
  const removeItem = useCompareStore((s) => s.removeItem);
  const clear = useCompareStore((s) => s.clear);
  const addToCart = useCartStore((s) => s.addItem);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Karsilastirilacak Urun Yok</h1>
        <p className="text-muted-foreground mb-6">
          Urun kartlarindaki karsilastir ikonuna tiklayarak urunleri karsilastirma listenize ekleyebilirsiniz.
        </p>
        <Link href="/kategori" className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors">
          Urunlere Goz At
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Urun Karsilastirma</h1>
        <button onClick={clear} className="text-sm text-danger hover:underline">
          Tumu Temizle
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          {/* Images */}
          <thead>
            <tr>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground w-32 border-b border-border">Urun</th>
              {items.map((item) => (
                <th key={item.id} className="p-3 text-center border-b border-border relative" style={{ minWidth: "200px" }}>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-muted rounded-full flex items-center justify-center hover:bg-danger hover:text-white transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <Link href={`/urun/${item.slug}`} className="block">
                    <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-muted mb-2">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={128} height={128} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold hover:text-primary transition-colors line-clamp-2">{item.name}</p>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Fiyat */}
            <tr className="bg-muted/30">
              <td className="p-3 text-sm font-medium text-muted-foreground border-b border-border">Fiyat</td>
              {items.map((item) => (
                <td key={item.id} className="p-3 text-center border-b border-border">
                  <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
                  {item.comparePrice && item.comparePrice > item.price && (
                    <span className="block text-xs text-muted-foreground line-through">{formatPrice(item.comparePrice)}</span>
                  )}
                </td>
              ))}
            </tr>
            {/* Marka */}
            <tr>
              <td className="p-3 text-sm font-medium text-muted-foreground border-b border-border">Marka</td>
              {items.map((item) => (
                <td key={item.id} className="p-3 text-center text-sm border-b border-border">
                  {item.brand || "-"}
                </td>
              ))}
            </tr>
            {/* Kategori */}
            <tr className="bg-muted/30">
              <td className="p-3 text-sm font-medium text-muted-foreground border-b border-border">Kategori</td>
              {items.map((item) => (
                <td key={item.id} className="p-3 text-center text-sm border-b border-border">
                  {item.category || "-"}
                </td>
              ))}
            </tr>
            {/* Stok Durumu */}
            <tr>
              <td className="p-3 text-sm font-medium text-muted-foreground border-b border-border">Stok Durumu</td>
              {items.map((item) => (
                <td key={item.id} className="p-3 text-center text-sm border-b border-border">
                  {item.stock > 0 ? (
                    <span className="text-success font-medium">Stokta ({item.stock})</span>
                  ) : (
                    <span className="text-danger font-medium">Tukendi</span>
                  )}
                </td>
              ))}
            </tr>
            {/* Sepete Ekle */}
            <tr className="bg-muted/30">
              <td className="p-3 text-sm font-medium text-muted-foreground"></td>
              {items.map((item) => (
                <td key={item.id} className="p-3 text-center">
                  <button
                    onClick={() => {
                      if (item.stock <= 0) return;
                      addToCart({
                        id: item.id,
                        name: item.name,
                        slug: item.slug,
                        price: item.price,
                        comparePrice: item.comparePrice,
                        image: item.image,
                        stock: item.stock,
                        minQty: 1,
                        maxQty: null,
                      });
                    }}
                    disabled={item.stock <= 0}
                    className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:bg-muted disabled:text-muted-foreground"
                  >
                    {item.stock > 0 ? "Sepete Ekle" : "Stokta Yok"}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
