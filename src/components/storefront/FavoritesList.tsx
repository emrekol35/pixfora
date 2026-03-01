"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useWishlistStore } from "@/store/wishlist";
import { useCartStore } from "@/store/cart";

interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  isActive: boolean;
  image: string | null;
  category: string | null;
}

interface FavoritesListProps {
  products: FavoriteProduct[];
}

export default function FavoritesList({ products }: FavoritesListProps) {
  const t = useTranslations("product");
  const common = useTranslations("common");
  const router = useRouter();
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const addToCart = useCartStore((s) => s.addItem);

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
    router.refresh();
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl">
        <svg
          className="w-16 h-16 text-muted-foreground mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <p className="text-muted-foreground text-lg mb-4">
          {t("emptyFavorites")}
        </p>
        <Link
          href="/kategori"
          className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
        >
          {t("browseFavorites")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition"
        >
          <Link href={`/urun/${product.slug}` as any}>
            <div className="aspect-square bg-muted relative">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              {!product.isActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {t("notForSale")}
                  </span>
                </div>
              )}
              {product.stock === 0 && product.isActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {t("outOfStock")}
                  </span>
                </div>
              )}
            </div>
          </Link>

          <div className="p-4">
            {product.category && (
              <span className="text-xs text-muted-foreground">
                {product.category}
              </span>
            )}
            <Link href={`/urun/${product.slug}` as any}>
              <h3 className="font-medium truncate mt-1 text-foreground hover:text-primary transition">
                {product.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-primary font-bold">
                {product.price.toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                })}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-muted-foreground text-sm line-through">
                  {product.comparePrice.toLocaleString("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => {
                  addToCart({
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    comparePrice: product.comparePrice,
                    image: product.image,
                    stock: product.stock,
                    minQty: 1,
                    maxQty: null,
                  });
                }}
                disabled={!product.isActive || product.stock === 0}
                className="flex-1 bg-primary text-white text-sm py-2 px-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("addToCart")}
              </button>
              <button
                onClick={() => handleRemove(product.id)}
                className="bg-danger text-white text-sm py-2 px-3 rounded-lg hover:opacity-90 transition"
              >
                {common("remove")}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
