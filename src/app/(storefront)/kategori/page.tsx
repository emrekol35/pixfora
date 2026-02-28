import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kategoriler",
  description: "Tum urun kategorilerini kesfet",
  alternates: { canonical: "/kategori" },
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          _count: { select: { products: true } },
        },
      },
      _count: { select: { products: true } },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
          <li>/</li>
          <li className="text-foreground font-medium">Kategoriler</li>
        </ol>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold mb-8">Tum Kategoriler</h1>

      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.id} className="border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/kategori/${cat.slug}`}
                className="text-lg font-bold text-foreground hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
              <span className="text-sm text-muted-foreground">
                {cat._count.products} urun
              </span>
            </div>
            {cat.description && (
              <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>
            )}
            {cat.children.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {cat.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/kategori/${child.slug}`}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted hover:bg-primary/5 hover:text-primary transition-colors text-sm"
                  >
                    <span>{child.name}</span>
                    <span className="text-xs text-muted-foreground">({child._count.products})</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Henuz kategori bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  );
}
