"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import CartRecommendations from "./CartRecommendations";

export default function CartPageClient() {
  const { items, removeItem, updateQuantity, getSubtotal, getItemPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    type: string;
    discount: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Sepetim</h1>
        <div className="text-center py-16 text-muted-foreground">Yukleniyor...</div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const couponDiscount = appliedCoupon?.discount || 0;
  const hasFreeShippingCoupon = appliedCoupon?.type === "FREE_SHIPPING";
  const shippingCost = (subtotal >= 500 || hasFreeShippingCoupon) ? 0 : 39.9;
  const total = subtotal - couponDiscount + shippingCost;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ type: data.type, discount: data.discount, message: data.message });
      } else {
        setCouponError(data.message || "Gecersiz kupon kodu");
      }
    } catch {
      setCouponError("Kupon dogrulanamadi");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // Checkout link'i kupon kodu ile
  const checkoutUrl = appliedCoupon ? `/odeme?coupon=${encodeURIComponent(couponCode)}` : "/odeme";

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Sepetim</h1>
        <div className="text-center py-16">
          <svg className="w-20 h-20 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <h2 className="text-lg font-medium text-muted-foreground mb-4">Sepetiniz bos</h2>
          <Link
            href="/kategori"
            className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Alisverise Basla
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Sepetim ({items.length} urun)</h1>
        <button
          onClick={() => {
            if (confirm("Sepeti temizlemek istediginizden emin misiniz?")) clearCart();
          }}
          className="text-sm text-danger hover:underline"
        >
          Sepeti Temizle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = getItemPrice(item);
            return (
              <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-border">
                {/* Image */}
                <div className="w-24 h-24 bg-muted rounded-lg shrink-0 overflow-hidden">
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/urun/${item.product.slug}`}
                    className="text-sm font-medium hover:text-primary line-clamp-2"
                  >
                    {item.product.name}
                  </Link>

                  {item.variant && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {Object.entries(item.variant.options).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </p>
                  )}

                  <p className="text-sm font-bold text-primary mt-1">{formatPrice(price)}</p>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-border rounded">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= item.product.minQty}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-danger hover:underline"
                    >
                      Kaldir
                    </button>
                  </div>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0">
                  <span className="font-bold">{formatPrice(price * item.quantity)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-border p-6 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Siparis Ozeti</h3>

            {/* Coupon */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kupon kodu"
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button
                    onClick={handleRemoveCoupon}
                    className="px-4 py-2 bg-danger/10 text-danger rounded-lg text-sm font-medium hover:bg-danger/20 transition-colors"
                  >
                    Kaldir
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? "..." : "Uygula"}
                  </button>
                )}
              </div>
              {couponError && (
                <p className="text-xs text-danger mt-1">{couponError}</p>
              )}
              {appliedCoupon && (
                <p className="text-xs text-success mt-1">{appliedCoupon.message}</p>
              )}
            </div>

            <div className="space-y-3 pb-4 border-b border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kupon Indirimi</span>
                  <span className="text-success font-medium">-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kargo</span>
                <span className={shippingCost === 0 ? "text-success font-medium" : ""}>
                  {shippingCost === 0 ? "Ucretsiz" : formatPrice(shippingCost)}
                </span>
              </div>
              {subtotal < 500 && !hasFreeShippingCoupon && (
                <p className="text-xs text-info">
                  {formatPrice(500 - subtotal)} daha ekleyerek ucretsiz kargo firsatindan yararlanin!
                </p>
              )}
            </div>

            <div className="flex justify-between py-4">
              <span className="font-bold text-lg">Toplam</span>
              <span className="font-bold text-lg text-primary">{formatPrice(total)}</span>
            </div>

            <Link
              href={checkoutUrl}
              className="block w-full py-3 text-center bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Odemeye Gec
            </Link>

            <Link
              href="/kategori"
              className="block w-full py-2.5 text-center text-sm text-muted-foreground hover:text-foreground mt-2"
            >
              Alisverise Devam Et
            </Link>
          </div>
        </div>
      </div>

      {/* Sepet Onerileri */}
      <CartRecommendations />
    </div>
  );
}
