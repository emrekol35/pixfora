import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CartPageClient from "@/components/storefront/CartPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    robots: { index: false, follow: false },
  };
}

export default function CartPage() {
  return <CartPageClient />;
}
