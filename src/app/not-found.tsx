import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadi - 404",
  description: "Aradiginiz sayfa bulunamadi.",
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Sayfa Bulunamadi</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Aradiginiz sayfa mevcut degil veya kaldirilmis olabilir.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Anasayfaya Don
          </Link>
          <Link
            href="/kategori"
            className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Kategorilere Goz At
          </Link>
        </div>
      </div>
    </div>
  );
}
