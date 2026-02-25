import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import CategoryProducts from "@/components/storefront/CategoryProducts";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Kategori Bulunamadi" };
  return {
    title: category.seoTitle || category.name,
    description: category.seoDescription || `${category.name} kategorisindeki urunler`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: { _count: { select: { products: true } } },
      },
      parent: { select: { name: true, slug: true } },
    },
  });

  if (!category || !category.isActive) notFound();

  // Pagination & Sorting
  const page = parseInt((sp.sayfa as string) || "1");
  const limit = 20;
  const skip = (page - 1) * limit;
  const sort = (sp.siralama as string) || "newest";
  const minPrice = sp.min ? parseFloat(sp.min as string) : undefined;
  const maxPrice = sp.max ? parseFloat(sp.max as string) : undefined;
  const brandSlug = sp.marka as string | undefined;

  // Kategori ve alt kategorilerin ID'lerini topla
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isActive: true,
    categoryId: { in: categoryIds },
  };
  if (minPrice) where.price = { ...where.price, gte: minPrice };
  if (maxPrice) where.price = { ...where.price, lte: maxPrice };
  if (brandSlug) {
    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (brand) where.brandId = brand.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  else if (sort === "price-desc") orderBy = { price: "desc" };
  else if (sort === "name") orderBy = { name: "asc" };
  else if (sort === "popular") orderBy = { isFeatured: "desc" };

  const [products, total, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
      orderBy,
      take: limit,
      skip,
    }),
    prisma.product.count({ where }),
    prisma.brand.findMany({
      where: {
        isActive: true,
        products: {
          some: { isActive: true, categoryId: { in: categoryIds } },
        },
      },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground flex-wrap">
          <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
          <li>/</li>
          <li><Link href="/kategori" className="hover:text-primary">Kategoriler</Link></li>
          {category.parent && (
            <>
              <li>/</li>
              <li>
                <Link href={`/kategori/${category.parent.slug}`} className="hover:text-primary">
                  {category.parent.name}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="text-foreground font-medium">{category.name}</li>
        </ol>
      </nav>

      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{category.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} urun bulundu</p>
        </div>
      </div>

      {/* Sub Categories */}
      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/kategori/${child.slug}`}
              className="px-4 py-1.5 text-sm rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              {child.name} ({child._count.products})
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      <CategoryProducts
        products={products}
        brands={brands}
        total={total}
        page={page}
        totalPages={totalPages}
        currentSort={sort}
        categorySlug={slug}
        currentBrand={brandSlug}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />
    </div>
  );
}
