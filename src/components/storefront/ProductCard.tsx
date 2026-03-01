"use client";

import React, { memo } from "react";
import { useThemeComponents } from "@/components/storefront/ThemeProvider";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    stock: number;
    minQty: number;
    maxQty?: number | null;
    images: { url: string; alt?: string | null }[];
    category?: { name: string } | null;
    brand?: { name: string } | null;
    isFeatured?: boolean;
    avgRating?: number;
    reviewCount?: number;
  };
}

function ProductCardDispatcher(props: ProductCardProps) {
  const { ProductCard: ThemedProductCard } = useThemeComponents();
  return <ThemedProductCard {...props} />;
}

const ProductCard = memo(ProductCardDispatcher);
export default ProductCard;
