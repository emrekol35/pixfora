import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import ProductDetail from "@/components/storefront/ProductDetail";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, seoTitle: true, seoDescription: true, shortDesc: true },
  });
  if (!product) return { title: "Urun Bulunamadi" };
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDesc || product.name,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" } },
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } },
      variantTypes: {
        orderBy: { order: "asc" },
        include: {
          options: { orderBy: { order: "asc" } },
        },
      },
      variants: {
        where: { isActive: true },
      },
      tags: true,
      reviews: {
        where: { isApproved: true },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: { reviews: { where: { isApproved: true } } },
      },
    },
  });

  if (!product || !product.isActive) notFound();

  // Ortalama puan
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  // Benzer urunler
  const relatedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
    take: 4,
  });

  // Variant options'lari duzgun formata cevir
  const variants = product.variants.map((v) => ({
    ...v,
    options: v.options as Record<string, string>,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground flex-wrap">
          <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
          {product.category && (
            <>
              <li>/</li>
              <li>
                <Link href={`/kategori/${product.category.slug}`} className="hover:text-primary">
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      <ProductDetail
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDesc: product.shortDesc,
          price: product.price,
          comparePrice: product.comparePrice,
          stock: product.stock,
          sku: product.sku,
          minQty: product.minQty,
          maxQty: product.maxQty,
          hasVariants: product.hasVariants,
          images: product.images,
          category: product.category,
          brand: product.brand,
          variantTypes: product.variantTypes,
          variants,
          tags: product.tags,
          reviews: product.reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
            user: r.user,
          })),
          reviewCount: product._count.reviews,
          avgRating,
        }}
        relatedProducts={relatedProducts}
      />
    </div>
  );
}
