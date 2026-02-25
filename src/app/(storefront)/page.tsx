import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Pixfora
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/kategori" className="text-sm text-muted-foreground hover:text-foreground">
              Kategoriler
            </Link>
            <Link href="/markalar" className="text-sm text-muted-foreground hover:text-foreground">
              Markalar
            </Link>
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
              Blog
            </Link>
            <Link href="/iletisim" className="text-sm text-muted-foreground hover:text-foreground">
              Iletisim
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/sepet" className="text-sm text-muted-foreground hover:text-foreground">
              Sepet (0)
            </Link>
            <Link
              href="/giris"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              Giris Yap
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Pixfora E-Ticaret
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            En kaliteli urunleri en uygun fiyatlarla kesfet.
          </p>
          <Link
            href="/kategori"
            className="inline-block px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors"
          >
            Alisverise Basla
          </Link>
        </div>
      </section>

      {/* Featured Section Placeholder */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">One Cikan Urunler</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-4 hover:shadow-lg transition-shadow"
            >
              <div className="w-full h-48 bg-muted rounded-lg mb-4" />
              <h3 className="font-medium text-sm mb-1">Ornek Urun {i}</h3>
              <p className="text-primary font-bold">₺0.00</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Pixfora</h3>
              <p className="text-sm text-white/60">
                E-Ticaret Sistemi
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Kurumsal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/sayfa/hakkimizda">Hakkimizda</Link></li>
                <li><Link href="/iletisim">Iletisim</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Yardim</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/sayfa/sss">Sikca Sorulan Sorular</Link></li>
                <li><Link href="/sayfa/iade-politikasi">Iade Politikasi</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Iletisim</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>info@pixfora.com</li>
                <li>+90 555 000 0000</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-white/40">
            2026 Pixfora. Tum haklari saklidir.
          </div>
        </div>
      </footer>
    </div>
  );
}
