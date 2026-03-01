"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function FooterCompact() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setSubscribed(true); setEmail("");
    } catch {}
  };

  return (
    <footer className="bg-foreground text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Brand + Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-2 text-primary-light">Pixfora</h3>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">{t("companyDescription")}</p>
            {subscribed ? (
              <p className="text-success text-sm font-medium">{t("newsletterSuccess")}</p>
            ) : (
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input type="email" placeholder={t("emailPlaceholder")}
                  className="px-4 py-2.5 rounded-lg text-sm text-foreground bg-white flex-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shrink-0">
                  {t("subscribe")}
                </button>
              </form>
            )}
            <div className="flex gap-3 mt-4">
              {["facebook", "instagram", "twitter"].map((name) => (
                <a key={name} href="#" aria-label={name} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-primary hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Right: Links in 3 columns */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t("corporate")}</h4>
              <ul className="space-y-2 text-xs text-white/60">
                <li><Link href="/sayfa/hakkimizda" className="hover:text-white transition-colors">{t("aboutUs")}</Link></li>
                <li><Link href="/iletisim" className="hover:text-white transition-colors">{t("contactTitle")}</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t("helpTitle")}</h4>
              <ul className="space-y-2 text-xs text-white/60">
                <li><Link href="/sayfa/sss" className="hover:text-white transition-colors">{t("faq")}</Link></li>
                <li><Link href="/sayfa/iade-politikasi" className="hover:text-white transition-colors">{t("returnAndExchange")}</Link></li>
                <li><Link href="/sayfa/kargo-bilgileri" className="hover:text-white transition-colors">{t("shippingInfo")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t("contactTitle")}</h4>
              <ul className="space-y-2 text-xs text-white/60">
                <li>info@pixfora.com</li>
                <li>+90 555 000 0000</li>
                <li>{t("location")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-white/40">
          <p>&copy; 2026 Pixfora. {t("copyright")}</p>
          <div className="flex items-center gap-3">
            <span>{t("securePayment")}</span>
            <span>|</span>
            <span>256-bit SSL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
