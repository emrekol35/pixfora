import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { addRatingToProducts } from "@/lib/product-helpers";
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
  const inStockOnly = sp.stok === "1";

  // Çoklu marka desteği (virgülle ayrılmış)
  const brandSlugs = sp.marka
    ? String(sp.marka).split(",").filter(Boolean)
    : [];

  // Kategori ve alt kategorilerin ID'lerini topla
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  // Marka slug'larını ID'lere çevir
  let brandIds: string[] = [];
  if (brandSlugs.length > 0) {
    const resolvedBrands = await prisma.brand.findMany({
      where: { slug: { in: brandSlugs } },
      select: { id: true },
    });
    brandIds = resolvedBrands.map((b) => b.id);
  }

  // Base where (facet hesabı için - filtreler hariç)
  const baseWhere = {
    isActive: true,
    categoryId: { in: categoryIds },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { ...baseWhere };
  if (minPrice) where.price = { ...where.price, gte: minPrice };
  if (maxPrice) where.price = { ...where.price, lte: maxPrice };
  if (brandIds.length > 0) where.brandId = { in: brandIds };
  if (inStockOnly) where.stock = { gt: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  else if (sort === "price-desc") orderBy = { price: "desc" };
  else if (sort === "name") orderBy = { name: "asc" };
  else if (sort === "popular") orderBy = { isFeatured: "desc" };

  const [products, total, brands, brandFacets, inStockCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
      orderBy,
      take: limit,
      skip,
    }),
    prisma.product.count({ where }),
    // Tüm markalar (bu kategorideki)
    prisma.brand.findMany({
      where: {
        isActive: true,
        products: {
          some: { isActive: true, categoryId: { in: categoryIds } },
        },
      },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    // Marka bazlı ürün sayıları (facet)
    prisma.product.groupBy({
      by: ["brandId"],
      where: { ...baseWhere, brandId: { not: null } },
      _count: { id: true },
    }),
    // Stokta olan ürün sayısı
    prisma.product.count({
      where: { ...baseWhere, stock: { gt: 0 } },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Brand count map oluştur
  const brandCountMap = new Map(
    brandFacets.map((g) => [g.brandId, g._count.id])
  );

  // brands'e count ekle
  const brandsWithCount = brands.map((b) => ({
    name: b.name,
    slug: b.slug,
    count: brandCountMap.get(b.id) || 0,
  }));

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
        products={addRatingToProducts(products)}
        brands={brandsWithCount}
        total={total}
        page={page}
        totalPages={totalPages}
        currentSort={sort}
        categorySlug={slug}
        currentBrands={brandSlugs}
        minPrice={minPrice}
        maxPrice={maxPrice}
        currentInStock={inStockOnly}
        inStockCount={inStockCount}
      />
    </div>
  );
}
