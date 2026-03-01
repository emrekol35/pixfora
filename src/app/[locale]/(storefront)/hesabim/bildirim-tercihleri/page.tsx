import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AccountSidebar from "@/components/storefront/AccountSidebar";
import NotificationPreferencesForm from "./NotificationPreferencesForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notification");
  return {
    title: t("preferencesTitle"),
    description: t("preferencesDescription"),
  };
}

const DEFAULT_PREFERENCES = {
  email_orders: true,
  email_promotions: true,
  email_stock_alerts: true,
  email_newsletter: true,
  push_orders: true,
  push_promotions: true,
  push_stock_alerts: true,
  push_cart_reminders: true,
};

export default async function NotificationPreferencesPage() {
  const t = await getTranslations("notification");
  const ta = await getTranslations("account");
  const session = await auth();
  if (!session?.user) redirect("/giris");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });

  const currentPrefs = (user?.notificationPreferences as Record<string, boolean>) || {};
  const preferences = { ...DEFAULT_PREFERENCES, ...currentPrefs };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <AccountSidebar userName={session.user.name || ta("user")} />
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6">{t("preferencesTitle")}</h1>
          <NotificationPreferencesForm initialPreferences={preferences} />
        </div>
      </div>
    </div>
  );
}
