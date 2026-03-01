import { TrendyolClient } from "./client";

// ---------- Types ----------

export interface TrendyolCategoryNode {
  id: number;
  name: string;
  parentId?: number;
  subCategories?: TrendyolCategoryNode[];
}

export interface TrendyolCategoryTreeResponse {
  categories: TrendyolCategoryNode[];
}

export interface TrendyolCategoryAttribute {
  categoryId: number;
  attribute: {
    id: number;
    name: string;
    displayName: string;
    required: boolean;
    allowCustom: boolean;
    varianter: boolean;
    slicer: boolean;
    attributeValues: {
      id: number;
      name: string;
    }[];
  };
}

export interface TrendyolCategoryAttributesResponse {
  id: number;
  name: string;
  displayName: string;
  categoryAttributes: TrendyolCategoryAttribute[];
}

export interface TrendyolBrandItem {
  id: number;
  name: string;
}

export interface TrendyolBrandsResponse {
  brands: TrendyolBrandItem[];
}

export interface TrendyolCargoProvider {
  id: number;
  code: string;
  name: string;
  taxNumber: string;
}

// ---------- Category Service ----------

/** Trendyol kategori ağacını al */
export async function getCategoryTree(
  client: TrendyolClient
): Promise<TrendyolCategoryNode[]> {
  const response = await client.request<TrendyolCategoryTreeResponse>({
    method: "GET",
    path: client.integrationPath("/product/product-categories"),
  });
  return response.categories || [];
}

/** Belirli kategorinin attribute'larını al */
export async function getCategoryAttributes(
  client: TrendyolClient,
  categoryId: number
): Promise<TrendyolCategoryAttributesResponse> {
  return client.request<TrendyolCategoryAttributesResponse>({
    method: "GET",
    path: client.integrationPath(
      `/product/product-categories/${categoryId}/attributes`
    ),
  });
}

// ---------- Brand Service ----------

/** Trendyol markalarını listele (sayfalı) */
export async function getBrands(
  client: TrendyolClient,
  page: number = 0,
  size: number = 1000
): Promise<TrendyolBrandItem[]> {
  const response = await client.request<TrendyolBrandsResponse>({
    method: "GET",
    path: client.integrationPath("/product/brands"),
    params: { page, size },
  });
  return response.brands || [];
}

/** İsme göre marka ara */
export async function searchBrandByName(
  client: TrendyolClient,
  name: string
): Promise<TrendyolBrandItem[]> {
  const response = await client.request<TrendyolBrandsResponse>({
    method: "GET",
    path: client.integrationPath("/product/brands/by-name"),
    params: { name },
  });
  return response.brands || [];
}

/** Kargo sağlayıcılarını al */
export async function getCargoProviders(
  client: TrendyolClient
): Promise<TrendyolCargoProvider[]> {
  const response = await client.request<{
    cargoCompanies: TrendyolCargoProvider[];
  }>({
    method: "GET",
    path: client.supplierPath("/cargo-companies"),
  });
  return response.cargoCompanies || [];
}

// ---------- Helpers ----------

/** Kategori ağacını düz listeye çevir (path ile) */
export function flattenCategoryTree(
  categories: TrendyolCategoryNode[],
  parentPath: string = ""
): { id: number; name: string; parentId: number | null; path: string }[] {
  const result: {
    id: number;
    name: string;
    parentId: number | null;
    path: string;
  }[] = [];

  for (const cat of categories) {
    const currentPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
    result.push({
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId ?? null,
      path: currentPath,
    });

    if (cat.subCategories && cat.subCategories.length > 0) {
      result.push(
        ...flattenCategoryTree(cat.subCategories, currentPath)
      );
    }
  }

  return result;
}
