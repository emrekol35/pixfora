"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  image: string | null;
  category: string | null;
  brand: string | null;
}

interface CompareState {
  items: CompareProduct[];
  addItem: (product: CompareProduct) => boolean;
  removeItem: (productId: string) => void;
  clear: () => void;
  isInCompare: (productId: string) => boolean;
  getCount: () => number;
}

const MAX_COMPARE = 4;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const state = get();
        if (state.items.length >= MAX_COMPARE) return false;
        if (state.items.some((i) => i.id === product.id)) return false;

        set({ items: [...state.items, product] });
        return true;
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        }));
      },

      clear: () => set({ items: [] }),

      isInCompare: (productId) => get().items.some((i) => i.id === productId),

      getCount: () => get().items.length,
    }),
    {
      name: "pixfora-compare",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
