"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
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
    <footer className="bg-foreground text-white mt-16">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold mb-1">E-Bulten</h3>
              <p className="text-sm text-white/60">
                Kampanya ve firsatlardan haberdar olmak icin abone olun.
              </p>
            </div>
            {subscribed ? (
              <p className="text-success text-sm font-medium">
                Basariyla abone oldunuz!
              </p>
            ) : (
              <form onSubmit={handleNewsletter} className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  className="px-4 py-2.5 rounded-lg text-sm text-foreground bg-white flex-1 md:w-72 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shrink-0"
                >
                  Abone Ol
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold mb-4 text-primary-light">Pixfora</h3>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              Kaliteli urunler, uygun fiyatlar ve guvenli alisveris deneyimi.
            </p>
            <div className="flex gap-3">
              {/* Social icons */}
              {["facebook", "instagram", "twitter"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-primary hover:text-white transition-colors"
                >
                  <span className="text-xs font-bold uppercase">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Corporate */}
          <div>
            <h4 className="font-semibold mb-4">Kurumsal</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>
                <Link href="/sayfa/hakkimizda" className="hover:text-white transition-colors">
                  Hakkimizda
                </Link>
              </li>
              <li>
                <Link href="/iletisim" className="hover:text-white transition-colors">
                  Iletisim
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/kariyer" className="hover:text-white transition-colors">
                  Kariyer
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold mb-4">Yardim</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>
                <Link href="/sayfa/sss" className="hover:text-white transition-colors">
                  Sikca Sorulan Sorular
                </Link>
              </li>
              <li>
                <Link href="/sayfa/iade-politikasi" className="hover:text-white transition-colors">
                  Iade ve Degisim
                </Link>
              </li>
              <li>
                <Link href="/sayfa/kargo-bilgileri" className="hover:text-white transition-colors">
                  Kargo Bilgileri
                </Link>
              </li>
              <li>
                <Link href="/sayfa/gizlilik-politikasi" className="hover:text-white transition-colors">
                  Gizlilik Politikasi
                </Link>
              </li>
              <li>
                <Link href="/sayfa/kullanim-kosullari" className="hover:text-white transition-colors">
                  Kullanim Kosullari
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Iletisim</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@pixfora.com
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +90 555 000 0000
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Istanbul, Turkiye
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            &copy; 2026 Pixfora. Tum haklari saklidir.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Guvenli Odeme</span>
            <span>|</span>
            <span>256-bit SSL</span>
            <span>|</span>
            <span>7/24 Destek</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
