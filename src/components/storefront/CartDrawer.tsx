"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/cart";
import { useTracking } from "./TrackingProvider";
import { useExperiment } from "@/hooks/useExperiment";
import FreeShippingBar from "./FreeShippingBar";

export default function CartDrawer() {
  const t = useTranslations("cart");
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal, getItemPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const { trackEvent } = useTracking();
  const freeShippingExp = useExperiment("free-shipping-bar");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && mounted) {
      trackEvent("view_cart", {
        itemCount: items.length,
        cartValue: getSubtotal(),
        source: "drawer",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">
            {t("myCart")} ({t("itemCount", { count: items.length })})
          </h2>
          <button
            onClick={closeCart}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free Shipping Bar (A/B test) */}
        {!freeShippingExp.isControl && items.length > 0 && <FreeShippingBar />}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <p className="text-muted-foreground text-sm">{t("empty")}</p>
              <button
                onClick={closeCart}
                className="mt-4 text-primary text-sm font-medium hover:underline"
              >
                {t("startShopping")}
              </button>
            </div>
          ) : (
            items.map((item) => {
              const price = getItemPrice(item);
              return (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-border last:border-0">
                  {/* Image */}
                  <div className="w-20 h-20 bg-muted rounded-lg shrink-0 overflow-hidden">
                    {item.product.image && (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/urun/${item.product.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium text-foreground hover:text-primary line-clamp-2"
                    >
                      {item.product.name}
                    </Link>

                    {item.variant && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {Object.entries(item.variant.options).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      </p>
                    )}

                    <p className="text-sm font-bold text-primary mt-1">
                      {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price)}
                    </p>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-border rounded">
                        <button
                          onClick={() => {
                            trackEvent("update_quantity", { productId: item.product.id, oldQty: item.quantity, newQty: item.quantity - 1 });
                            updateQuantity(item.id, item.quantity - 1);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
                          disabled={item.quantity <= item.product.minQty}
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            trackEvent("update_quantity", { productId: item.product.id, oldQty: item.quantity, newQty: item.quantity + 1 });
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          trackEvent("remove_from_cart", {
                            productId: item.product.id,
                            productName: item.product.name,
                            price: getItemPrice(item),
                          });
                          removeItem(item.id);
                        }}
                        className="text-xs text-danger hover:underline"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold">
                      {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-white shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{t("subtotal")}</span>
              <span className="text-lg font-bold">
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(getSubtotal())}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/sepet"
                onClick={closeCart}
                className="flex-1 py-2.5 text-center border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("goToCart")}
              </Link>
              <Link
                href="/odeme"
                onClick={closeCart}
                className="flex-1 py-2.5 text-center bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                {t("proceedToCheckout")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
