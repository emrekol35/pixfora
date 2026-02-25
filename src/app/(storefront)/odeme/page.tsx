import type { Metadata } from "next";
import CheckoutClient from "@/components/storefront/CheckoutClient";

export const metadata: Metadata = {
  title: "Odeme",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
