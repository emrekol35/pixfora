"use client";

import Image from "next/image";
import Link from "next/link";
import { useRecentlyViewedStore } from "@/store/recently-viewed";

export default function RecentlyViewed() {
  const items = useRecentlyViewedStore((s) => s.items);

  if (items.length === 0) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Son Goruntulediginiz</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.slice(0, 12).map((item) => (
          <Link
            key={item.id}
            href={`/urun/${item.slug}`}
            className="group block rounded-xl border border-border hover:border-primary hover:shadow-md transition-all overflow-hidden"
          >
            <div className="aspect-square bg-muted relative overflow-hidden">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-2.5">
              {item.category && (
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-0.5">{item.category}</p>
              )}
              <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">{item.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm font-bold text-primary">{formatPrice(item.price)}</span>
                {item.comparePrice && item.comparePrice > item.price && (
                  <span className="text-[10px] text-muted-foreground line-through">{formatPrice(item.comparePrice)}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
