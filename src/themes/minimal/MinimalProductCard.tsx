"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SHIMMER_PLACEHOLDER } from "@/lib/image-utils";
import { useCartStore } from "@/store/cart";
import { trackEvent } from "@/lib/tracking";
import type { ProductCardProps } from "@/themes/types";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export default function MinimalProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const image = product.images[0];

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

  return (
    <Link
      href={`/urun/${product.slug}`}
      className="group block border border-border/50 bg-background"
      onClick={() =>
        trackEvent("product_click", {
          productId: product.id,
          productName: product.name,
        })
      }
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted/30 overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            placeholder="blur"
            blurDataURL={SHIMMER_PLACEHOLDER}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={0.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Hover: Add to Cart */}
        {product.stock > 0 && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-0 left-0 right-0 py-3 bg-background/90 backdrop-blur-sm text-[10px] tracking-[0.2em] uppercase text-foreground text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            Sepete Ekle
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4 text-center">
        <h3 className="text-xs tracking-[0.1em] uppercase font-light text-foreground line-clamp-1 mb-2">
          {product.name}
        </h3>
        <p className="text-xs tracking-wide text-muted-foreground">
          {priceFormatter.format(product.price)}
        </p>
      </div>
    </Link>
  );
}
