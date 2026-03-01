"use client";

import { create } from "zustand";

interface ThemeSettingsStore {
  settings: Record<string, string>;
  loaded: boolean;
  setSettings: (s: Record<string, string>) => void;
  getSetting: (key: string, fallback: string) => string;
}

export const useThemeSettings = create<ThemeSettingsStore>((set, get) => ({
  settings: {},
  loaded: false,
  setSettings: (s) => set({ settings: s, loaded: true }),
  getSetting: (key, fallback) => get().settings[key] || fallback,
}));
