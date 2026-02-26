"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";

// Giris yapmis kullanicilarin localStorage sepetini DB'ye senkronize eder
// Debounce ile gereksiz API cagrilarini onler
export default function CartSyncProvider() {
  const { data: session } = useSession();
  const items = useCartStore((state) => state.items);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (!session?.user) return;

    // Sepet icerigini karsilastir
    const itemsKey = JSON.stringify(
      items.map((i) => ({
        productId: i.product.id,
        variantId: i.variant?.id || null,
        quantity: i.quantity,
      }))
    );

    // Ayni veri zaten sync edilmisse atla
    if (itemsKey === lastSyncedRef.current) return;

    // Debounce - 5 saniye bekle
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const syncData = items.map((i) => ({
          productId: i.product.id,
          variantId: i.variant?.id || null,
          quantity: i.quantity,
        }));

        const res = await fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: syncData }),
        });

        if (res.ok) {
          lastSyncedRef.current = itemsKey;
        }
      } catch {
        // Sessizce hatla, kritik degil
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session?.user, items]);

  return null;
}
