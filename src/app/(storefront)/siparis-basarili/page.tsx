import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Siparis Basarili",
};

interface Props {
  searchParams: Promise<{ no?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const orderNumber = sp.no;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
        <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold mb-3">Siparisfiniz Alindi!</h1>
      <p className="text-muted-foreground mb-6">
        Siparisfiniz basariyla olusturuldu. Siparis durumunuzu asagidaki numarayla takip edebilirsiniz.
      </p>

      {orderNumber && (
        <div className="bg-muted rounded-xl p-6 mb-8">
          <p className="text-sm text-muted-foreground mb-1">Siparis Numarasi</p>
          <p className="text-2xl font-bold text-primary">{orderNumber}</p>
        </div>
      )}

      <div className="space-y-3 max-w-sm mx-auto">
        <Link
          href="/hesabim/siparislerim"
          className="block py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
        >
          Siparislerimi Gor
        </Link>
        <Link
          href="/"
          className="block py-3 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          Anasayfaya Don
        </Link>
      </div>

      <div className="mt-12 p-4 bg-info/10 rounded-lg text-sm text-info">
        Siparis onay e-postasi kisa surede adresinize gonderilecektir.
      </div>
    </div>
  );
}
