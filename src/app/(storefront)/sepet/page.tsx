import type { Metadata } from "next";
import CartPageClient from "@/components/storefront/CartPageClient";

export const metadata: Metadata = {
  title: "Sepet",
  description: "Alisveris sepetinizdeki urunleri goruntuleyin",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageClient />;
}
