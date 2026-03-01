"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function BoldFooter() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
      setEmail("");
    } catch {
      // silent
    }
  };

  return (
    <footer className="mt-16">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-extrabold text-white mb-2">
                {t("newsletterTitle")}
              </h3>
              <p className="text-white/70 text-sm">
                {t("newsletterDescription")}
              </p>
            </div>
            {subscribed ? (
              <p className="text-green-300 text-sm font-bold bg-white/10 px-6 py-3 rounded-full">
                {t("newsletterSuccess")}
              </p>
            ) : (
              <form onSubmit={handleNewsletter} className="flex gap-3 w-full md:w-auto">
                <input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  className="px-5 py-3 rounded-full text-sm text-gray-800 bg-white flex-1 md:w-72 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-orange-400 text-white rounded-full text-sm font-bold hover:bg-orange-500 hover:scale-105 transition-all shadow-lg shrink-0"
                >
                  {t("subscribe")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* About */}
            <div>
              <h3 className="text-2xl font-extrabold mb-4 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                Pixfora
              </h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                {t("companyDescription")}
              </p>
              {/* Social Icons - Large & Colorful */}
              <div className="flex gap-3">
                {[
                  {
                    name: "facebook",
                    href: "#",
                    color: "bg-blue-600 hover:bg-blue-700",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    ),
                  },
                  {
                    name: "instagram",
                    href: "#",
                    color: "bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    ),
                  },
                  {
                    name: "twitter",
                    href: "#",
                    color: "bg-gray-800 hover:bg-gray-700",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    ),
                  },
                  {
                    name: "youtube",
                    href: "#",
                    color: "bg-red-600 hover:bg-red-700",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    ),
                  },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className={`w-11 h-11 rounded-full ${social.color} flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-sm mb-4 text-violet-400 uppercase tracking-wider">
                  {t("corporate")}
                </h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li>
                    <Link href="/sayfa/hakkimizda" className="hover:text-white transition-colors">
                      {t("aboutUs")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/iletisim" className="hover:text-white transition-colors">
                      {t("contactTitle")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="hover:text-white transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/kariyer" className="hover:text-white transition-colors">
                      {t("career")}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-4 text-pink-400 uppercase tracking-wider">
                  {t("helpTitle")}
                </h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li>
                    <Link href="/sayfa/sss" className="hover:text-white transition-colors">
                      {t("faq")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/sayfa/iade-politikasi" className="hover:text-white transition-colors">
                      {t("returnAndExchange")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/sayfa/kargo-bilgileri" className="hover:text-white transition-colors">
                      {t("shippingInfo")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/sayfa/gizlilik-politikasi" className="hover:text-white transition-colors">
                      {t("privacyPolicy")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/sayfa/kullanim-kosullari" className="hover:text-white transition-colors">
                      {t("termsOfUse")}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-sm mb-4 text-orange-400 uppercase tracking-wider">
                {t("contactTitle")}
              </h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  info@pixfora.com
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-pink-600/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  +90 555 000 0000
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-600/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  {t("location")}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Gradient */}
      <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/50">
            &copy; 2026 Pixfora. {t("copyright")}
          </p>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t("securePayment")}
            </span>
            <span>|</span>
            <span>256-bit SSL</span>
            <span>|</span>
            <span>{t("support247")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
