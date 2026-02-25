import type { Metadata } from "next";
import CartPageClient from "@/components/storefront/CartPageClient";

export const metadata: Metadata = {
  title: "Sepet",
};

export default function CartPage() {
  return <CartPageClient />;
}
