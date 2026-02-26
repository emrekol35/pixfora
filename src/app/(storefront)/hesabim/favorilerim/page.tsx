export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import FavoritesList from "@/components/storefront/FavoritesList";

export default async function FavoritesPage() {
  const session = await auth();

  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId: session!.user!.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          stock: true,
          isActive: true,
          images: { take: 1, select: { url: true } },
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const products = wishlistItems.map((w) => ({
    id: w.product.id,
    name: w.product.name,
    slug: w.product.slug,
    price: w.product.price,
    comparePrice: w.product.comparePrice,
    stock: w.product.stock,
    isActive: w.product.isActive,
    image: w.product.images[0]?.url || null,
    category: w.product.category?.name || null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Favorilerim</h1>
      <FavoritesList products={products} />
    </div>
  );
}
