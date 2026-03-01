import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import HomeProducts from "@/components/storefront/HomeProducts";
import JsonLd from "@/components/seo/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sayfa?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) return { title: "Marka Bulunamadi" };
  const locale = await getLocale();
  let brandName = brand.name;
  let brandSeoTitle = brand.seoTitle;
  let brandSeoDesc = brand.seoDescription;
  if (locale !== "tr") {
    const { getEntityTranslations } = await import("@/lib/translations");
    const tr = await getEntityTranslations("brand", brand.id, locale);
    if (tr.name) brandName = tr.name;
    if (tr.seoTitle) brandSeoTitle = tr.seoTitle;
    if (tr.seoDescription) brandSeoDesc = tr.seoDescription;
  }
  return {
    title: brandSeoTitle || brandName,
    description: brandSeoDesc || `${brandName} markasindan urunler`,
    alternates: { canonical: `/marka/${slug}` },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parseInt(sp.sayfa || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand || !brand.isActive) notFound();

  // i18n: DB çevirilerini uygula
  const locale = await getLocale();
  if (locale !== "tr") {
    const { getEntityTranslations } = await import("@/lib/translations");
    const tr = await getEntityTranslations("brand", brand.id, locale);
    if (tr.name) (brand as any).name = tr.name;
    if (tr.description) (brand as any).description = tr.description;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, brandId: brand.id },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.product.count({ where: { isActive: true, brandId: brand.id } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const BASE_URL = process.env.AUTH_URL || "https://pixfora.com";
  const breadcrumbItems = [
    { name: "Anasayfa", url: BASE_URL },
    { name: "Markalar", url: `${BASE_URL}/markalar` },
    { name: brand.name, url: `${BASE_URL}/marka/${slug}` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <JsonLd data={getBreadcrumbSchema(breadcrumbItems)} />

      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
          <li>/</li>
          <li><Link href="/markalar" className="hover:text-primary">Markalar</Link></li>
          <li>/</li>
          <li className="text-foreground font-medium">{brand.name}</li>
        </ol>
      </nav>

      <div className="flex items-center gap-4 mb-8">
        {brand.logo && (
          <Image src={brand.logo} alt={brand.name} width={64} height={64} className="object-contain" />
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{brand.name}</h1>
          <p className="text-sm text-muted-foreground">{total} urun</p>
        </div>
      </div>

      {brand.description && (
        <p className="text-sm text-muted-foreground mb-8 max-w-3xl">{brand.description}</p>
      )}

      {products.length > 0 ? (
        <HomeProducts products={products} />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>Bu markada henuz urun bulunmuyor.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/marka/${slug}?sayfa=${page - 1}`}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
            >
              ← Onceki
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Sayfa {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/marka/${slug}?sayfa=${page + 1}`}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
            >
              Sonraki →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
