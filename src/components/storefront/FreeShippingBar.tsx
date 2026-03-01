"use client";

import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";

const FREE_SHIPPING_THRESHOLD = 500; // TRY

export default function FreeShippingBar() {
  const subtotal = useCartStore((s) => s.getSubtotal());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const achieved = remaining <= 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="px-4 py-3 border-b border-border">
      {achieved ? (
        <div className="flex items-center gap-2 text-sm text-success font-medium">
          <span>🎉</span>
          <span>Ucretsiz kargo kazandiniz!</span>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold text-foreground">
              {formatPrice(remaining)}
            </span>{" "}
            daha ekleyin, <span className="text-primary font-medium">ucretsiz kargo</span> kazanin!
          </p>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
