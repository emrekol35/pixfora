"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  image?: string | null;
  stock: number;
  minQty: number;
  maxQty?: number | null;
}

export interface CartVariant {
  id: string;
  sku?: string | null;
  price?: number | null;
  stock: number;
  options: Record<string, string>;
}

export interface CartItem {
  id: string; // local cart item id
  product: CartProduct;
  variant?: CartVariant | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: CartProduct, quantity?: number, variant?: CartVariant | null) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getItemPrice: (item: CartItem) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, variant = null) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              (variant ? item.variant?.id === variant.id : !item.variant)
          );

          if (existingIndex > -1) {
            const updated = [...state.items];
            const existingItem = updated[existingIndex];
            const newQty = existingItem.quantity + quantity;
            const maxStock = variant ? variant.stock : product.stock;
            const maxQty = product.maxQty || maxStock;

            updated[existingIndex] = {
              ...existingItem,
              quantity: Math.min(newQty, maxQty),
            };
            return { items: updated, isOpen: true };
          }

          const newItem: CartItem = {
            id: `${product.id}-${variant?.id || "default"}-${Date.now()}`,
            product,
            variant,
            quantity: Math.max(quantity, product.minQty),
          };
          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId) return item;
            const maxStock = item.variant ? item.variant.stock : item.product.stock;
            const maxQty = item.product.maxQty || maxStock;
            const clampedQty = Math.max(item.product.minQty, Math.min(quantity, maxQty));
            return { ...item, quantity: clampedQty };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = get().getItemPrice(item);
          return sum + price * item.quantity;
        }, 0);
      },

      getItemPrice: (item) => {
        if (item.variant?.price) return item.variant.price;
        return item.product.price;
      },
    }),
    {
      name: "pixfora-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
