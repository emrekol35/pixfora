import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Odeme Basarisiz",
  robots: { index: false, follow: false },
};

export default function PaymentFailedPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">✕</span>
      </div>
      <h1 className="text-2xl font-bold mb-4">Odeme Basarisiz</h1>
      <p className="text-muted-foreground mb-8">
        Odeme isleminiz tamamlanamadi. Lutfen kart bilgilerinizi kontrol edip tekrar deneyin.
      </p>
      <div className="flex gap-3 justify-center">
        <Link
          href="/sepet"
          className="px-6 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted"
        >
          Sepete Don
        </Link>
        <Link
          href="/"
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
        >
          Anasayfa
        </Link>
      </div>
    </div>
  );
}
