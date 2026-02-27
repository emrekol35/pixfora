"use client";

import { useQuery } from "@tanstack/react-query";

// Dashboard istatistikleri
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/reports/dashboard");
      if (!res.ok) throw new Error("Dashboard verileri alinamadi");
      return res.json();
    },
  });
}

// Satis raporu
export function useSalesReport(params: {
  startDate?: string;
  endDate?: string;
}) {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  return useQuery({
    queryKey: ["sales-report", params.startDate, params.endDate],
    queryFn: async () => {
      const res = await fetch(`/api/reports/sales?${qs.toString()}`);
      if (!res.ok) throw new Error("Satis verileri alinamadi");
      return res.json();
    },
  });
}

// Urun raporu
export function useProductReport(
  params: { limit?: number; startDate?: string; endDate?: string } = {}
) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  return useQuery({
    queryKey: [
      "product-report",
      params.limit,
      params.startDate,
      params.endDate,
    ],
    queryFn: async () => {
      const res = await fetch(`/api/reports/products?${qs.toString()}`);
      if (!res.ok) throw new Error("Urun verileri alinamadi");
      return res.json();
    },
  });
}

// Musteri raporu
export function useCustomerReport(
  params: { limit?: number; startDate?: string; endDate?: string } = {}
) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  return useQuery({
    queryKey: [
      "customer-report",
      params.limit,
      params.startDate,
      params.endDate,
    ],
    queryFn: async () => {
      const res = await fetch(`/api/reports/customers?${qs.toString()}`);
      if (!res.ok) throw new Error("Musteri verileri alinamadi");
      return res.json();
    },
  });
}

// Genel bakis / KPI
export function useOverviewReport() {
  return useQuery({
    queryKey: ["overview-report"],
    queryFn: async () => {
      const res = await fetch("/api/reports/overview");
      if (!res.ok) throw new Error("Genel bakis verileri alinamadi");
      return res.json();
    },
  });
}

// Kargo performansi raporu
export function useShippingReport(params: {
  startDate?: string;
  endDate?: string;
}) {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  return useQuery({
    queryKey: ["shipping-report", params.startDate, params.endDate],
    queryFn: async () => {
      const res = await fetch(`/api/reports/shipping?${qs.toString()}`);
      if (!res.ok) throw new Error("Kargo verileri alinamadi");
      return res.json();
    },
  });
}

// Iade analizi raporu
export function useReturnReport(params: {
  startDate?: string;
  endDate?: string;
}) {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  return useQuery({
    queryKey: ["return-report", params.startDate, params.endDate],
    queryFn: async () => {
      const res = await fetch(`/api/reports/returns?${qs.toString()}`);
      if (!res.ok) throw new Error("Iade verileri alinamadi");
      return res.json();
    },
  });
}
