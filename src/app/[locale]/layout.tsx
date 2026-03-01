import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import ServiceWorkerRegister from "@/components/shared/ServiceWorkerRegister";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEN = locale === "en";

  return {
    metadataBase: new URL(process.env.AUTH_URL || "https://pixfora.com"),
    title: {
      default: isEN ? "Pixfora - E-Commerce" : "Pixfora - E-Ticaret",
      template: "%s | Pixfora",
    },
    description: isEN
      ? "Pixfora E-Commerce - Quality products, affordable prices"
      : "Pixfora E-Ticaret Sistemi - Kaliteli urunler, uygun fiyatlar",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Pixfora",
    },
    icons: {
      icon: "/icons/icon-192.png",
      apple: "/icons/apple-touch-icon.png",
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
    openGraph: {
      type: "website",
      locale: isEN ? "en_US" : "tr_TR",
      siteName: "Pixfora",
      title: isEN ? "Pixfora - E-Commerce" : "Pixfora - E-Ticaret",
      description: isEN
        ? "Quality products, affordable prices and secure shopping experience."
        : "Kaliteli urunler, uygun fiyatlar ve guvenli alisveris deneyimi.",
    },
    twitter: {
      card: "summary_large_image",
      title: isEN ? "Pixfora - E-Commerce" : "Pixfora - E-Ticaret",
      description: isEN
        ? "Quality products, affordable prices and secure shopping experience."
        : "Kaliteli urunler, uygun fiyatlar ve guvenli alisveris deneyimi.",
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      languages: {
        tr: "/",
        en: "/en",
      },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as "tr" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <ServiceWorkerRegister />
    </NextIntlClientProvider>
  );
}
