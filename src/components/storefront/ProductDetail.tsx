"use client";

import { useThemeComponents } from "./ThemeProvider";
import type { ProductDetailProps } from "@/themes/hooks/useProductDetailLogic";

export type { ProductDetailProps };

export default function ProductDetail(props: ProductDetailProps) {
  const { ProductDetail: ThemedProductDetail } = useThemeComponents();
  return <ThemedProductDetail {...props} />;
}
