// Prisma urun sorgusu sonucuna avgRating ve reviewCount ekler
// Kullanim: const enriched = addRatingToProducts(products);
export function addRatingToProducts<
  T extends { reviews?: { rating: number }[] }
>(products: T[]): (Omit<T, "reviews"> & { avgRating: number; reviewCount: number })[] {
  return products.map((p) => {
    const reviews = p.reviews || [];
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { reviews: _, ...rest } = p;
    return { ...rest, avgRating, reviewCount };
  });
}

// Prisma include'a reviews eklemek icin standart include objesi
export const productListInclude = {
  images: { orderBy: { order: "asc" as const }, take: 1 },
  category: { select: { name: true } },
  brand: { select: { name: true } },
  reviews: {
    where: { isApproved: true },
    select: { rating: true },
  },
};
