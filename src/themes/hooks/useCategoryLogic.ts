"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";

export interface CategoryProductsProps {
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    stock: number;
    minQty: number;
    maxQty: number | null;
    isFeatured: boolean;
    images: { url: string; alt: string | null }[];
    category: { name: string } | null;
    brand: { name: string } | null;
    avgRating?: number;
    reviewCount?: number;
  }[];
  brands: { name: string; slug: string; count: number }[];
  total: number;
  page: number;
  totalPages: number;
  currentSort: string;
  categorySlug: string;
  currentBrands: string[];
  minPrice?: number;
  maxPrice?: number;
  currentInStock: boolean;
  inStockCount: number;
}

export function useCategoryLogic(props: CategoryProductsProps) {
  const {
    products,
    brands,
    total,
    page,
    totalPages,
    currentSort,
    categorySlug,
    currentBrands,
    minPrice,
    maxPrice,
    currentInStock,
    inStockCount,
  } = props;

  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minPrice?.toString() || "");
  const [localMax, setLocalMax] = useState(maxPrice?.toString() || "");

  const activeFilterCount =
    currentBrands.length +
    (minPrice !== undefined || maxPrice !== undefined ? 1 : 0) +
    (currentInStock ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const buildUrl = useCallback(
    (params: Record<string, string | undefined>): any => {
      const base = `/kategori/${categorySlug}`;
      const sp = new URLSearchParams();
      const allParams: Record<string, string | undefined> = {
        siralama: currentSort !== "newest" ? currentSort : undefined,
        marka: currentBrands.length > 0 ? currentBrands.join(",") : undefined,
        min: minPrice?.toString(),
        max: maxPrice?.toString(),
        stok: currentInStock ? "1" : undefined,
        ...params,
      };
      Object.entries(allParams).forEach(([k, v]) => {
        if (v) sp.set(k, v);
      });
      const qs = sp.toString();
      return qs ? `${base}?${qs}` : base;
    },
    [categorySlug, currentSort, currentBrands, minPrice, maxPrice, currentInStock]
  );

  const toggleBrand = useCallback(
    (slug: string) => {
      const next = currentBrands.includes(slug)
        ? currentBrands.filter((s) => s !== slug)
        : [...currentBrands, slug];
      router.push(buildUrl({ marka: next.length > 0 ? next.join(",") : undefined, sayfa: undefined }));
    },
    [currentBrands, buildUrl, router]
  );

  const applyPrice = useCallback(() => {
    router.push(
      buildUrl({
        min: localMin || undefined,
        max: localMax || undefined,
        sayfa: undefined,
      })
    );
  }, [localMin, localMax, buildUrl, router]);

  const changeSort = useCallback(
    (value: string) => {
      router.push(buildUrl({ siralama: value, sayfa: undefined }));
    },
    [buildUrl, router]
  );

  const toggleStock = useCallback(() => {
    router.push(buildUrl({ stok: currentInStock ? undefined : "1", sayfa: undefined }));
  }, [currentInStock, buildUrl, router]);

  const toggleFilter = useCallback(() => {
    setFilterOpen((prev) => !prev);
  }, []);

  // Price presets
  const pricePresets = [
    { label: "Tumu", min: undefined as string | undefined, max: undefined as string | undefined },
    { label: "0 - 100\u20BA", min: "0", max: "100" },
    { label: "100 - 500\u20BA", min: "100", max: "500" },
    { label: "500 - 1000\u20BA", min: "500", max: "1000" },
    { label: "1000\u20BA+", min: "1000", max: undefined as string | undefined },
  ];

  const isPresetActive = (preset: typeof pricePresets[number]) =>
    (preset.min === minPrice?.toString() && preset.max === maxPrice?.toString()) ||
    (!preset.min && !minPrice && !maxPrice);

  const selectPreset = useCallback(
    (preset: typeof pricePresets[number]) => {
      router.push(buildUrl({ min: preset.min, max: preset.max, sayfa: undefined }));
    },
    [buildUrl, router]
  );

  // Pagination helpers
  const getPageNumbers = useCallback(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter(
      (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
    );
  }, [totalPages, page]);

  return {
    // Data
    products,
    brands,
    total,
    page,
    totalPages,
    currentSort,
    categorySlug,
    currentBrands,
    minPrice,
    maxPrice,
    currentInStock,
    inStockCount,

    // State
    filterOpen,
    localMin,
    setLocalMin,
    localMax,
    setLocalMax,

    // Computed
    activeFilterCount,
    hasActiveFilters,

    // Handlers
    buildUrl,
    toggleBrand,
    applyPrice,
    changeSort,
    toggleStock,
    toggleFilter,
    pricePresets,
    isPresetActive,
    selectPreset,
    getPageNumbers,
  };
}

export type CategoryLogic = ReturnType<typeof useCategoryLogic>;
