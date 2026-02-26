"use client";

import Image from "next/image";
import Link from "next/link";
import { useCompareStore } from "@/store/compare";

export default function CompareBar() {
  const items = useCompareStore((s) => s.items);
  const removeItem = useCompareStore((s) => s.removeItem);
  const clear = useCompareStore((s) => s.clear);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-primary shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Label */}
          <div className="shrink-0">
            <p className="text-sm font-bold">Karsilastir</p>
            <p className="text-xs text-muted-foreground">{items.length}/4 urun</p>
          </div>

          {/* Product Chips */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1.5 shrink-0"
              >
                <div className="w-8 h-8 rounded overflow-hidden bg-white shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
                <span className="text-xs font-medium max-w-[100px] truncate">{item.name}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-danger shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clear}
              className="px-3 py-2 text-xs text-muted-foreground hover:text-danger transition-colors"
            >
              Temizle
            </button>
            <Link
              href="/karsilastir"
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Karsilastir ({items.length})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
