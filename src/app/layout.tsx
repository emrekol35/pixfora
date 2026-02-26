import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pixfora - E-Ticaret",
    template: "%s | Pixfora",
  },
  description: "Pixfora E-Ticaret Sistemi - Kaliteli urunler, uygun fiyatlar",
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
