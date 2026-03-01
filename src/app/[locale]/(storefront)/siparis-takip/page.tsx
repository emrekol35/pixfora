import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import OrderTrackingClient from "@/components/storefront/OrderTrackingClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tracking");
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
  };
}

export default async function OrderTrackingPage() {
  const t = await getTranslations("tracking");
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 text-center">{t("metaTitle")}</h1>
      <p className="text-muted-foreground text-center mb-8">
        {t("subtitle")}
      </p>
      <OrderTrackingClient />
    </div>
  );
}
