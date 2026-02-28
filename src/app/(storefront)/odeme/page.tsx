import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutClient from "@/components/storefront/CheckoutClient";

export const metadata: Metadata = {
  title: "Odeme",
  description: "Siparisinizi tamamlayin",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8"><p>Yukleniyor...</p></div>}>
      <CheckoutClient />
    </Suspense>
  );
}
