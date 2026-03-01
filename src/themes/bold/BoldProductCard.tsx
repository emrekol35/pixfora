"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SHIMMER_PLACEHOLDER } from "@/lib/image-utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useCompareStore } from "@/store/compare";
import { trackEvent } from "@/lib/tracking";
import type { ProductCardProps } from "@/themes/types";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export default function BoldProductCard({ product }: ProductCardProps) {
  const t = useTranslations("product");
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id));
  const addToCompare = useCompareStore((s) => s.addItem);
  const removeFromCompare = useCompareStore((s) => s.removeItem);
  const isInCompare = useCompareStore((s) => s.isInCompare(product.id));
  const image = product.images[0];
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (product.stock <= 0) return;

      addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        comparePrice: product.comparePrice,
        image: image?.url || null,
        stock: product.stock,
        minQty: product.minQty,
        maxQty: product.maxQty,
      });
      trackEvent("add_to_cart", {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        source: "product_card",
      });
    },
    [addItem, product, image]
  );

  const handleToggleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleWishlist(product.id);
    },
    [toggleWishlist, product.id]
  );

  const handleToggleCompare = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isInCompare) {
        removeFromCompare(product.id);
      } else {
        addToCompare({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          comparePrice: product.comparePrice || null,
          stock: product.stock,
          image: image?.url || null,
          category: product.category?.name || null,
          brand: product.brand?.name || null,
        });
      }
    },
    [isInCompare, removeFromCompare, addToCompare, product, image]
  );

  return (
    <Link
      href={`/urun/${product.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-purple-100"
      onClick={() => trackEvent("product_click", { productId: product.id, productName: product.name })}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            placeholder="blur"
            blurDataURL={SHIMMER_PLACEHOLDER}
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-extrabold rounded-full shadow-lg">
              %{discountPercent}
            </span>
          )}
          {product.isFeatured && (
            <span className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {t("featured")}
            </span>
          )}
          {product.stock <= 0 && (
            <span className="px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded-full">
              {t("outOfStock")}
            </span>
          )}
        </div>

        {/* Wishlist - Animated heart */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg z-10 ${
            isInWishlist
              ? "bg-pink-500 text-white scale-110"
              : "bg-white/90 backdrop-blur text-gray-400 hover:text-pink-500 hover:scale-110"
          }`}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isInWishlist ? "animate-pulse" : ""}`}
            fill={isInWishlist ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Compare button on hover */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleCompare}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isInCompare
                ? "bg-violet-600 text-white"
                : "bg-white/90 backdrop-blur text-gray-500 hover:text-violet-600 hover:bg-white"
            }`}
            title={isInCompare ? t("removeFromCompare") : t("compare")}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {product.category && (
          <p className="text-[11px] text-violet-500 uppercase tracking-wider font-bold mb-1">
            {product.category.name}
          </p>
        )}
        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-violet-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.avgRating && product.avgRating > 0 && product.reviewCount && product.reviewCount > 0 ? (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3.5 h-3.5 ${star <= Math.round(product.avgRating!) ? "text-orange-400" : "text-gray-200"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-400 font-medium">({product.reviewCount})</span>
          </div>
        ) : null}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-extrabold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            {priceFormatter.format(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through font-medium">
              {priceFormatter.format(product.comparePrice!)}
            </span>
          )}
        </div>

        {/* Always visible "Sepete Ekle" button */}
        {product.stock > 0 ? (
          <button
            onClick={handleAddToCart}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold rounded-full hover:from-violet-700 hover:to-pink-600 hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {t("addToCart")}
          </button>
        ) : (
          <div className="w-full py-2.5 bg-gray-200 text-gray-500 text-sm font-bold rounded-full text-center">
            {t("outOfStock")}
          </div>
        )}
      </div>
    </Link>
  );
}
