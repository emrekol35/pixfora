import Link from "next/link";

const contentModules = [
  { title: "Sayfalar", href: "/admin/icerik/sayfalar", icon: "📄", desc: "Statik sayfalar (Hakkimizda, SSS vb.)" },
  { title: "Blog", href: "/admin/icerik/blog", icon: "✍️", desc: "Blog yazilari ve kategoriler" },
  { title: "Sliderlar", href: "/admin/icerik/sliderlar", icon: "🖼️", desc: "Ana sayfa slider gorselleri" },
  { title: "Menuler", href: "/admin/icerik/menuler", icon: "📋", desc: "Navigasyon menuleri" },
  { title: "Pop-uplar", href: "/admin/icerik/popuplar", icon: "💬", desc: "Promosyon ve bildirim pop-uplari" },
  { title: "Duyurular", href: "/admin/icerik/duyurular", icon: "📢", desc: "Ust bar duyuru mesajlari" },
];

export default function ContentIndexPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Icerik Yonetimi</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentModules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
          >
            <span className="text-3xl">{mod.icon}</span>
            <h2 className="text-lg font-semibold mt-3">{mod.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{mod.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
