import { HepsiburadaClient } from "./client";

// ---------- Types ----------

export interface HepsiburadaCategoryNode {
  categoryId: number;
  name: string;
  parentCategoryId?: number;
  available?: boolean;
  leaf?: boolean;
  paths?: string;
}

export interface HepsiburadaCategoryAttribute {
  id: string;
  name: string;
  displayName?: string;
  mandatory: boolean;
  type: string; // "enum" | "text" | "numeric" etc.
  multiValue?: boolean;
  values?: { id: string; value: string }[];
}

export interface HepsiburadaCategoryAttributesResponse {
  data: HepsiburadaCategoryAttribute[];
}

// ---------- Category Service ----------

/** Tüm Hepsiburada kategorilerini al */
export async function getAllCategories(
  client: HepsiburadaClient
): Promise<HepsiburadaCategoryNode[]> {
  const response = await client.request<{ data: HepsiburadaCategoryNode[] } | HepsiburadaCategoryNode[]>({
    method: "GET",
    service: "mpop",
    path: "/product/api/categories/get-all-categories",
  });

  if (Array.isArray(response)) return response;
  return (response as { data: HepsiburadaCategoryNode[] }).data || [];
}

/** Belirli kategorinin attribute'larını al */
export async function getCategoryAttributes(
  client: HepsiburadaClient,
  categoryId: number
): Promise<HepsiburadaCategoryAttribute[]> {
  const response = await client.request<HepsiburadaCategoryAttributesResponse | HepsiburadaCategoryAttribute[]>({
    method: "GET",
    service: "mpop",
    path: `/product/api/categories/${categoryId}/attributes`,
  });

  if (Array.isArray(response)) return response;
  return (response as HepsiburadaCategoryAttributesResponse).data || [];
}

// ---------- Helpers ----------

/** Flat kategori listesinden path/breadcrumb oluştur */
export function buildCategoryPaths(
  categories: HepsiburadaCategoryNode[]
): { id: number; name: string; parentId: number | null; path: string; available: boolean; leaf: boolean }[] {
  // Id → category map
  const catMap = new Map<number, HepsiburadaCategoryNode>();
  for (const cat of categories) {
    catMap.set(cat.categoryId, cat);
  }

  function getPath(cat: HepsiburadaCategoryNode): string {
    const parts: string[] = [cat.name];
    let current = cat;
    while (current.parentCategoryId) {
      const parent = catMap.get(current.parentCategoryId);
      if (!parent) break;
      parts.unshift(parent.name);
      current = parent;
    }
    return parts.join(" > ");
  }

  return categories.map((cat) => ({
    id: cat.categoryId,
    name: cat.name,
    parentId: cat.parentCategoryId ?? null,
    path: getPath(cat),
    available: cat.available ?? true,
    leaf: cat.leaf ?? false,
  }));
}
