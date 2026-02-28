import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/shared/ServiceWorkerRegister";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL || "https://pixfora.com"),
  title: {
    default: "Pixfora - E-Ticaret",
    template: "%s | Pixfora",
  },
  description: "Pixfora E-Ticaret Sistemi - Kaliteli urunler, uygun fiyatlar",
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
    locale: "tr_TR",
    siteName: "Pixfora",
    title: "Pixfora - E-Ticaret",
    description: "Kaliteli urunler, uygun fiyatlar ve guvenli alisveris deneyimi.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixfora - E-Ticaret",
    description: "Kaliteli urunler, uygun fiyatlar ve guvenli alisveris deneyimi.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
