export const dynamic = "force-dynamic";
import ContactForm from "@/components/storefront/ContactForm";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: "/iletisim" },
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">{t("title")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Form */}
        <ContactForm />

        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">{t("contactInfo")}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div><p className="font-medium">{t("addressLabel")}</p><p className="text-sm text-muted-foreground">{t("addressValue")}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <div><p className="font-medium">{t("emailLabel")}</p><p className="text-sm text-muted-foreground">info@pixfora.com</p></div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <div><p className="font-medium">{t("phoneLabel")}</p><p className="text-sm text-muted-foreground">{t("phoneValue")}</p></div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2">{t("workingHours")}</h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{t("weekdays")}</p>
              <p>{t("saturday")}</p>
              <p>{t("sunday")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
