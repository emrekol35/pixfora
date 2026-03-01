"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { COLOR_CSS_MAP, DARK_COLOR_CSS_MAP } from "@/lib/theme-utils";
import { useThemeSettings } from "@/hooks/useThemeSettings";

interface ThemeContextValue {
  isDark: boolean;
  toggleDarkMode: () => void;
  darkModeEnabled: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleDarkMode: () => {},
  darkModeEnabled: true,
});

export const useTheme = () => useContext(ThemeContext);

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
  const setThemeStoreSettings = useThemeSettings((s) => s.setSettings);

  // Fetch theme settings
  useEffect(() => {
    async function loadTheme() {
      try {
        const res = await fetch("/api/settings/theme");
        const data = await res.json();
        const s = data.settings || {};
        setSettings(s);
        setThemeStoreSettings(s);
      } catch {
        // Fallback: use static CSS @theme values
      }
    }
    loadTheme();
  }, [setThemeStoreSettings]);

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

    // Font size
    if (settings.theme_font_size_base) {
      root.style.fontSize = settings.theme_font_size_base;
    }

    // Border radius
    if (settings.theme_border_radius) {
      root.dataset.radius = settings.theme_border_radius;
    }

    // Container width
    if (settings.theme_container_width) {
      root.style.setProperty("--container-max-width", settings.theme_container_width + "px");
    }

    // Dark class
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Custom CSS
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
    <ThemeContext.Provider value={{ isDark, toggleDarkMode, darkModeEnabled }}>
      {children}
    </ThemeContext.Provider>
  );
}
