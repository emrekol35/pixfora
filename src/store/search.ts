"use client";

import { create } from "zustand";

interface SearchState {
  query: string;
  isOpen: boolean;
  results: SearchResult[];
  isLoading: boolean;

  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setLoading: (loading: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
  reset: () => void;
}

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  category?: string | null;
}

export const useSearchStore = create<SearchState>()((set) => ({
  query: "",
  isOpen: false,
  results: [],
  isLoading: false,

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setLoading: (isLoading) => set({ isLoading }),
  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false, query: "", results: [] }),
  reset: () => set({ query: "", results: [], isLoading: false }),
}));
