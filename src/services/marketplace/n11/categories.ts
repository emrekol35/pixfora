import { N11Client } from "./client";

// ---------- Types ----------

export interface N11CategoryNode {
  id: number;
  name: string;
  subCategories?: N11CategoryNode[] | null;
}

export interface N11CategoryAttribute {
  attributeId: number;
  categoryId: number;
  attributeName: string;
  isMandatory: boolean;
  isVariant: boolean;
  isSlicer: boolean;
  isCustomValue: boolean;
  isN11Grouping: boolean;
  attributeOrder: number;
  attributeValues: { id: number; value: string }[];
}

export interface N11CategoryAttributeResponse {
  id: number;
  name: string;
  categoryAttributes: N11CategoryAttribute[];
}

// ---------- Category Service ----------

/** Tüm N11 kategorilerini al */
export async function getAllCategories(
  client: N11Client
): Promise<N11CategoryNode[]> {
  const response = await client.request<N11CategoryNode[]>({
    method: "GET",
    path: "/cdn/categories",
  });

  return Array.isArray(response) ? response : [];
}

/** Belirli kategorinin attribute'larını al */
export async function getCategoryAttributes(
  client: N11Client,
  categoryId: number
): Promise<N11CategoryAttributeResponse> {
  return client.request<N11CategoryAttributeResponse>({
    method: "GET",
    path: `/cdn/category/${categoryId}/attribute`,
  });
}

// ---------- Helpers ----------

interface FlatCategory {
  id: number;
  name: string;
  parentId: number | null;
  path: string;
  leaf: boolean;
}

/** Ağaç yapısındaki kategorileri flat listeye çevir */
export function flattenCategories(categories: N11CategoryNode[]): FlatCategory[] {
  const result: FlatCategory[] = [];

  function traverse(cats: N11CategoryNode[], parentId: number | null, pathParts: string[]) {
    for (const cat of cats) {
      const currentPath = [...pathParts, cat.name];
      const isLeaf = !cat.subCategories || cat.subCategories.length === 0;

      result.push({
        id: cat.id,
        name: cat.name,
        parentId,
        path: currentPath.join(" > "),
        leaf: isLeaf,
      });

      if (cat.subCategories && cat.subCategories.length > 0) {
        traverse(cat.subCategories, cat.id, currentPath);
      }
    }
  }

  traverse(categories, null, []);
  return result;
}
