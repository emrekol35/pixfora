"use client";

import { useThemeComponents } from "./ThemeProvider";
import type { CategoryProductsProps } from "@/themes/hooks/useCategoryLogic";

export type { CategoryProductsProps };

export default function CategoryProducts(props: CategoryProductsProps) {
  const { CategoryProducts: ThemedCategoryProducts } = useThemeComponents();
  return <ThemedCategoryProducts {...props} />;
}
