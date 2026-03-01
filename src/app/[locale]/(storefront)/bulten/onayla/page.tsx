import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "E-Bulten Onay",
  description: "E-bulten aboneliginizi onaylayin.",
  robots: { index: false, follow: false },
};

async function confirmSubscription(
  token: string | null,
  t: (key: string) => string
) {
  if (!token) return { success: false, message: t("invalidLink") };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/newsletter/confirm?token=${token}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message };
    }
    return { success: false, message: data.error || t("genericError") };
  } catch {
    return { success: false, message: t("connectionError") };
  }
}

export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = await getTranslations("newsletter");
  const { token } = await searchParams;
  const result = await confirmSubscription(token || null, t);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${
          result.success ? "bg-success/10" : "bg-danger/10"
        }`}>
          {result.success ? (
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-3">
          {result.success ? t("confirmSuccessHeading") : t("confirmFailHeading")}
        </h1>

        <p className="text-muted-foreground mb-6">{result.message}</p>

        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          {t("returnHome")}
        </Link>
      </div>
    </div>
  );
}
