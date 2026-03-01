import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import CheckoutClient from "@/components/storefront/CheckoutClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return {
    title: t("title"),
    description: t("title"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage() {
  const common = await getTranslations("common");
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8"><p>{common("loading")}</p></div>}>
      <CheckoutClient />
    </Suspense>
  );
}
