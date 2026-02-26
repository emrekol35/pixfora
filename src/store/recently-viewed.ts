"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  image: string | null;
  category: string | null;
  viewedAt: number;
}

interface RecentlyViewedState {
  items: RecentProduct[];
  addItem: (product: Omit<RecentProduct, "viewedAt">) => void;
  getItems: () => RecentProduct[];
  clear: () => void;
}

const MAX_ITEMS = 20;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          // Zaten varsa cikar
          const filtered = state.items.filter((i) => i.id !== product.id);
          // Basa ekle
          const newItem: RecentProduct = { ...product, viewedAt: Date.now() };
          const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
          return { items: updated };
        });
      },

      getItems: () => get().items,

      clear: () => set({ items: [] }),
    }),
    {
      name: "pixfora-recently-viewed",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
