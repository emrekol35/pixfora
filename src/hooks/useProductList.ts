"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";

export interface ProductListParams {
  page: number;
  limit: number;
  search: string;
  categoryId: string;
  brandId: string;
  isActive: string; // "true" | "false" | "" (tumu)
}

export interface ProductListItem {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  images: { url: string; alt: string | null }[];
  _count: { variants: number; reviews: number };
}

export interface ProductListResponse {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useProductList(params: ProductListParams) {
  const qs = new URLSearchParams();
  qs.set("page", params.page.toString());
  qs.set("limit", params.limit.toString());
  if (params.search) qs.set("search", params.search);
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  if (params.brandId) qs.set("brandId", params.brandId);
  if (params.isActive) qs.set("isActive", params.isActive);

  return useQuery<ProductListResponse>({
    queryKey: ["admin-products", params],
    queryFn: async () => {
      const res = await fetch(`/api/products?${qs.toString()}`);
      if (!res.ok) throw new Error("Urunler yuklenemedi");
      return res.json();
    },
    placeholderData: keepPreviousData,
  });
}

// Filtre dropdown verileri
export function useFilterOptions() {
  const categories = useQuery<{ id: string; name: string }[]>({
    queryKey: ["admin-categories-filter"],
    queryFn: async () => {
      const res = await fetch("/api/categories?flat=true");
      if (!res.ok) throw new Error("Kategoriler yuklenemedi");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  const brands = useQuery<{ id: string; name: string }[]>({
    queryKey: ["admin-brands-filter"],
    queryFn: async () => {
      const res = await fetch("/api/brands");
      if (!res.ok) throw new Error("Markalar yuklenemedi");
      const data = await res.json();
      return data.brands || data;
    },
    staleTime: 10 * 60 * 1000,
  });

  return { categories, brands };
}
