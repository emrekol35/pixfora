"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWishlistStore } from "@/store/wishlist";

export default function WishlistInit() {
  const { data: session } = useSession();
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const clear = useWishlistStore((s) => s.clear);
  const isLoaded = useWishlistStore((s) => s.isLoaded);

  useEffect(() => {
    if (session?.user && !isLoaded) {
      fetchWishlist();
    } else if (!session?.user) {
      clear();
    }
  }, [session, isLoaded, fetchWishlist, clear]);

  return null;
}
