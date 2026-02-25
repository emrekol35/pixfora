import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import HomeProducts from "@/components/storefront/HomeProducts";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sayfa?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) return { title: "Marka Bulunamadi" };
  return {
    title: brand.seoTitle || brand.name,
    description: brand.seoDescription || `${brand.name} markasindan urunler`,
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
          <img src={brand.logo} alt={brand.name} className="w-16 h-16 object-contain" />
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
