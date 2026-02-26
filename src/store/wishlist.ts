import { create } from "zustand";

interface WishlistStore {
  items: string[];
  isLoaded: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getCount: () => number;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  isLoaded: false,

  fetchWishlist: async () => {
    try {
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        set({
          items: data.map((item: { id: string }) => item.id),
          isLoaded: true,
        });
      }
    } catch {
      // silently fail
    }
  },

  toggleWishlist: async (productId: string) => {
    const { items } = get();
    const isIn = items.includes(productId);

    // Optimistic update
    if (isIn) {
      set({ items: items.filter((id) => id !== productId) });
    } else {
      set({ items: [...items, productId] });
    }

    try {
      const res = await fetch("/api/wishlist", {
        method: isIn ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        // Revert on failure
        set({ items });
      }
    } catch {
      set({ items });
    }
  },

  isInWishlist: (productId: string) => get().items.includes(productId),
  getCount: () => get().items.length,
  clear: () => set({ items: [], isLoaded: false }),
}));
