"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ---------- Config ----------

export function useTrendyolConfig() {
  return useQuery({
    queryKey: ["trendyol", "config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/integrations");
      const data = await res.json();
      const trendyol = (Array.isArray(data) ? data : []).find(
        (i: any) => i.service === "trendyol"
      );
      return trendyol || null;
    },
  });
}

// ---------- Categories ----------

export function useTrendyolCategories(params?: {
  search?: string;
  parentId?: number | null;
  mappedOnly?: boolean;
}) {
  return useQuery({
    queryKey: ["trendyol", "categories", params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set("search", params.search);
      if (params?.parentId !== undefined && params.parentId !== null)
        sp.set("parentId", String(params.parentId));
      if (params?.mappedOnly) sp.set("mappedOnly", "true");
      const res = await fetch(`/api/admin/marketplace/trendyol/categories?${sp}`);
      return res.json();
    },
  });
}

export function useSyncCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/marketplace/trendyol/categories", {
        method: "POST",
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trendyol", "categories"] }),
  });
}

export function useMapCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      mappings: { trendyolCategoryId: number; localCategoryId: string | null }[]
    ) => {
      const res = await fetch("/api/admin/marketplace/trendyol/categories/map", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trendyol", "categories"] }),
  });
}

export function useCategoryAttributes(categoryId: number | null) {
  return useQuery({
    queryKey: ["trendyol", "categoryAttributes", categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const res = await fetch(
        `/api/admin/marketplace/trendyol/categories/${categoryId}/attributes`
      );
      return res.json();
    },
    enabled: !!categoryId,
  });
}

// ---------- Brands ----------

export function useTrendyolBrands(params?: {
  search?: string;
  page?: number;
  size?: number;
  mappedOnly?: boolean;
}) {
  return useQuery({
    queryKey: ["trendyol", "brands", params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set("search", params.search);
      if (params?.page !== undefined) sp.set("page", String(params.page));
      if (params?.size) sp.set("size", String(params.size));
      if (params?.mappedOnly) sp.set("mappedOnly", "true");
      const res = await fetch(`/api/admin/marketplace/trendyol/brands?${sp}`);
      return res.json();
    },
  });
}

export function useSyncBrands() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/marketplace/trendyol/brands", {
        method: "POST",
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trendyol", "brands"] }),
  });
}

export function useAutoMatchBrands() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/marketplace/trendyol/brands/map", {
        method: "POST",
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trendyol", "brands"] }),
  });
}

// ---------- Products ----------

export function useTrendyolProducts(params?: {
  search?: string;
  page?: number;
  size?: number;
  syncStatus?: string;
}) {
  return useQuery({
    queryKey: ["trendyol", "products", params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set("search", params.search);
      if (params?.page !== undefined) sp.set("page", String(params.page));
      if (params?.size) sp.set("size", String(params.size));
      if (params?.syncStatus) sp.set("syncStatus", params.syncStatus);
      const res = await fetch(`/api/admin/marketplace/trendyol/products?${sp}`);
      return res.json();
    },
  });
}

export function useExportProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const res = await fetch("/api/admin/marketplace/trendyol/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trendyol", "products"] }),
  });
}

export function useBulkSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(
        "/api/admin/marketplace/trendyol/products/bulk-sync",
        { method: "POST" }
      );
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trendyol", "products"] }),
  });
}

export function useUpdatePriceStock() {
  return useMutation({
    mutationFn: async (productIds?: string[]) => {
      const res = await fetch(
        "/api/admin/marketplace/trendyol/products/price-stock",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds }),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
  });
}

export function useCheckBatchStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (batchRequestId: string) => {
      const res = await fetch(
        "/api/admin/marketplace/trendyol/products/batch-status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchRequestId }),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trendyol", "products"] }),
  });
}

// ---------- Orders ----------

export function useTrendyolOrders(params?: {
  search?: string;
  page?: number;
  size?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ["trendyol", "orders", params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set("search", params.search);
      if (params?.page !== undefined) sp.set("page", String(params.page));
      if (params?.size) sp.set("size", String(params.size));
      if (params?.status) sp.set("status", params.status);
      const res = await fetch(`/api/admin/marketplace/trendyol/orders?${sp}`);
      return res.json();
    },
  });
}

export function usePullOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params?: { startDate?: number; endDate?: number }) => {
      const res = await fetch("/api/admin/marketplace/trendyol/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params || {}),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trendyol", "orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      trackingNumber,
      cargoProviderCode,
    }: {
      orderId: string;
      status: string;
      trackingNumber?: string;
      cargoProviderCode?: string;
    }) => {
      const res = await fetch(
        `/api/admin/marketplace/trendyol/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, trackingNumber, cargoProviderCode }),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trendyol", "orders"] }),
  });
}

export function useUpdateShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      trackingNumber,
      cargoProviderCode,
    }: {
      orderId: string;
      trackingNumber: string;
      cargoProviderCode: string;
    }) => {
      const res = await fetch(
        `/api/admin/marketplace/trendyol/orders/${orderId}/shipping`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingNumber, cargoProviderCode }),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trendyol", "orders"] }),
  });
}
