"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useSearchStore } from "@/store/search";

export function useHeaderLogic() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCart = useCartStore((s) => s.openCart);
  const wishlistCount = useWishlistStore((s) => s.getCount());

  const {
    query, setQuery,
    suggestions, setSuggestions,
    isLoading, setLoading,
    isOpen, openSearch, closeSearch,
    recentSearches, addRecentSearch,
  } = useSearchStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSearch]);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (value.length < 2) {
        setSuggestions(null);
        if (value.length === 0 && recentSearches.length > 0) openSearch();
        return;
      }
      openSearch();
      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value)}`);
          setSuggestions(await res.json());
        } catch {
          setSuggestions(null);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [setQuery, setSuggestions, setLoading, openSearch, recentSearches.length]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && query.length >= 2) {
        e.preventDefault();
        addRecentSearch(query);
        closeSearch();
        router.push(`/arama?q=${encodeURIComponent(query)}`);
      }
    },
    [query, addRecentSearch, closeSearch, router]
  );

  const handleFocus = useCallback(() => {
    if (query.length >= 2 || recentSearches.length > 0) openSearch();
  }, [query, recentSearches.length, openSearch]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return {
    session,
    mounted,
    itemCount,
    openCart,
    wishlistCount,
    mobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    // Search
    query,
    suggestions,
    isLoading,
    isOpen,
    searchRef,
    handleSearch,
    handleKeyDown,
    handleFocus,
    closeSearch,
  };
}
