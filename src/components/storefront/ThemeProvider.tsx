"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { COLOR_CSS_MAP, DARK_COLOR_CSS_MAP } from "@/lib/theme-utils";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { getThemeLoader, getThemeMeta } from "@/themes/registry";
import type { ThemeComponents } from "@/themes/types";

// Default components (static import for instant fallback)
import defaultComponents from "@/themes/default";

interface ThemeContextValue {
  isDark: boolean;
  toggleDarkMode: () => void;
  darkModeEnabled: boolean;
  activeThemeId: string;
  components: ThemeComponents;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleDarkMode: () => {},
  darkModeEnabled: true,
  activeThemeId: "default",
  components: defaultComponents,
});

export const useTheme = () => useContext(ThemeContext);
export const useThemeComponents = () => useContext(ThemeContext).components;

function loadGoogleFont(fontFamily: string) {
  const id = `gfont-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  full: "9999px",
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isDark, setIsDark] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState("default");
  const [components, setComponents] = useState<ThemeComponents>(defaultComponents);
  const setThemeStoreSettings = useThemeSettings((s) => s.setSettings);

  // Fetch theme settings
  useEffect(() => {
    async function loadTheme() {
      try {
        const res = await fetch("/api/settings/theme");
        const data = await res.json();
        const s = data.settings || {};

        // Merge theme default settings with user overrides
        const themeId = s.theme_active_theme || "default";
        const meta = getThemeMeta(themeId);
        const merged = { ...(meta?.defaultSettings || {}), ...s };

        setSettings(merged);
        setActiveThemeId(themeId);
        setThemeStoreSettings(merged);
      } catch {
        // Fallback: use default theme
      }
    }
    loadTheme();
  }, [setThemeStoreSettings]);

  // Load active theme components
  useEffect(() => {
    if (activeThemeId === "default") {
      setComponents(defaultComponents);
      return;
    }
    const loader = getThemeLoader(activeThemeId);
    if (!loader) {
      setComponents(defaultComponents);
      return;
    }
    loader()
      .then((themeComponents) => {
        // Fallback to default for any missing components
        setComponents({
          Header: themeComponents.Header || defaultComponents.Header,
          Footer: themeComponents.Footer || defaultComponents.Footer,
          ProductCard: themeComponents.ProductCard || defaultComponents.ProductCard,
          HeroSection: themeComponents.HeroSection || defaultComponents.HeroSection,
          CategoryGrid: themeComponents.CategoryGrid || defaultComponents.CategoryGrid,
          PromotionBanner: themeComponents.PromotionBanner || defaultComponents.PromotionBanner,
          TrustBadges: themeComponents.TrustBadges || defaultComponents.TrustBadges,
          ProductDetail: themeComponents.ProductDetail || defaultComponents.ProductDetail,
          CategoryProducts: themeComponents.CategoryProducts || defaultComponents.CategoryProducts,
        });
      })
      .catch(() => setComponents(defaultComponents));
  }, [activeThemeId]);

  // Initialize dark mode
  useEffect(() => {
    const stored = localStorage.getItem("pixfora-dark-mode");
    if (stored !== null) {
      setIsDark(stored === "true");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDark(true);
    }
  }, []);

  // Apply CSS variables
  useEffect(() => {
    if (Object.keys(settings).length === 0) return;
    const root = document.documentElement;

    const colorMap = isDark ? DARK_COLOR_CSS_MAP : COLOR_CSS_MAP;
    for (const [settingKey, cssVar] of Object.entries(colorMap)) {
      const value = settings[settingKey];
      if (value) root.style.setProperty(cssVar, value);
    }

    if (settings.theme_font_size_base) {
      root.style.fontSize = settings.theme_font_size_base;
    }

    if (settings.theme_border_radius) {
      root.dataset.radius = settings.theme_border_radius;
    }

    if (settings.theme_container_width) {
      root.style.setProperty("--container-max-width", settings.theme_container_width + "px");
    }

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (settings.theme_custom_css) {
      let styleEl = document.getElementById("pixfora-custom-css");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "pixfora-custom-css";
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = settings.theme_custom_css;
    }
  }, [settings, isDark]);

  // Dynamic font loading
  useEffect(() => {
    const fontFamily = settings.theme_font_family;
    if (!fontFamily) return;
    loadGoogleFont(fontFamily);
    document.documentElement.style.setProperty(
      "--font-sans",
      `"${fontFamily}", system-ui, -apple-system, sans-serif`
    );

    const headingFamily = settings.theme_font_heading_family;
    if (headingFamily) {
      loadGoogleFont(headingFamily);
      document.documentElement.style.setProperty(
        "--font-heading",
        `"${headingFamily}", system-ui, -apple-system, sans-serif`
      );
    }
  }, [settings.theme_font_family, settings.theme_font_heading_family]);

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("pixfora-dark-mode", String(next));
      return next;
    });
  }, []);

  const darkModeEnabled = settings.theme_dark_mode_enabled !== "false";

  return (
    <ThemeContext.Provider value={{ isDark, toggleDarkMode, darkModeEnabled, activeThemeId, components }}>
      {children}
    </ThemeContext.Provider>
  );
}
