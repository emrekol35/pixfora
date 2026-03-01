import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("categoryPage");
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: "/kategori" },
  };
}

export default async function CategoriesPage() {
  const t = await getTranslations("categoryPage");
  const common = await getTranslations("common");

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

  // i18n: DB çevirilerini uygula
  const locale = await getLocale();
  if (locale !== "tr") {
    const { getBulkTranslations } = await import("@/lib/translations");
    // Ana kategorilerin adlarını çevir
    const catIds = categories.map(c => c.id);
    const childIds = categories.flatMap(c => c.children.map(ch => ch.id));
    const allIds = [...catIds, ...childIds];
    const translations = await getBulkTranslations("category", allIds, locale);
    for (const cat of categories) {
      const tr = translations.get(cat.id);
      if (tr?.name) (cat as any).name = tr.name;
      if (tr?.description) (cat as any).description = tr.description;
      for (const child of cat.children) {
        const childTr = translations.get(child.id);
        if (childTr?.name) (child as any).name = childTr.name;
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">{t("breadcrumbHome")}</Link></li>
          <li>/</li>
          <li className="text-foreground font-medium">{t("breadcrumbCategories")}</li>
        </ol>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold mb-8">{t("allCategories")}</h1>

      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.id} className="border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/kategori/${cat.slug}` as any}
                className="text-lg font-bold text-foreground hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
              <span className="text-sm text-muted-foreground">
                {common("productCount", { count: cat._count.products })}
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
                    href={`/kategori/${child.slug}` as any}
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
            <p className="text-lg">{t("noCategories")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
