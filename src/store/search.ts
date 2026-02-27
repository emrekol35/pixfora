"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  category?: string | null;
}

export interface SuggestionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  image: string | null;
  category: string | null;
}

export interface SuggestionCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface SuggestionBrand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface SearchSuggestions {
  products: SuggestionProduct[];
  categories: SuggestionCategory[];
  brands: SuggestionBrand[];
}

interface SearchState {
  query: string;
  isOpen: boolean;
  results: SearchResult[];
  suggestions: SearchSuggestions | null;
  isLoading: boolean;
  recentSearches: string[];

  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setSuggestions: (suggestions: SearchSuggestions | null) => void;
  setLoading: (loading: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
  reset: () => void;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

const MAX_RECENT = 10;

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: "",
      isOpen: false,
      results: [],
      suggestions: null,
      isLoading: false,
      recentSearches: [],

      setQuery: (query) => set({ query }),
      setResults: (results) => set({ results }),
      setSuggestions: (suggestions) => set({ suggestions }),
      setLoading: (isLoading) => set({ isLoading }),
      openSearch: () => set({ isOpen: true }),
      closeSearch: () => set({ isOpen: false, query: "", results: [], suggestions: null }),
      reset: () => set({ query: "", results: [], suggestions: null, isLoading: false }),
      addRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed || trimmed.length < 2) return state;
          const filtered = state.recentSearches.filter(
            (s) => s.toLowerCase() !== trimmed.toLowerCase()
          );
          return { recentSearches: [trimmed, ...filtered].slice(0, MAX_RECENT) };
        }),
      removeRecentSearch: (query) =>
        set((state) => ({
          recentSearches: state.recentSearches.filter(
            (s) => s.toLowerCase() !== query.toLowerCase()
          ),
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "pixfora-recent-searches",
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    }
  )
);
