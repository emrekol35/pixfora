import type { ThemeMeta, ThemeComponents } from "./types";

// ---- Theme Metadata ----

export const THEME_LIST: ThemeMeta[] = [
  {
    id: "default",
    name: "Modern",
    description: "Temiz ve profesyonel varsayilan tema. Top bar, gradient hero, hover efektli kartlar.",
    previewColors: { primary: "#2563eb", secondary: "#64748b", background: "#ffffff", foreground: "#0f172a", accent: "#3b82f6" },
    defaultSettings: {
      theme_color_primary: "#2563eb",
      theme_color_primary_dark: "#1d4ed8",
      theme_color_primary_light: "#60a5fa",
      theme_color_secondary: "#64748b",
      theme_color_background: "#ffffff",
      theme_color_foreground: "#0f172a",
      theme_font_family: "Inter",
      theme_border_radius: "lg",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Butik ve luks magazalar icin sade tasarim. Bol bosluk, ince tipografi, az efekt.",
    previewColors: { primary: "#1a1a1a", secondary: "#999999", background: "#ffffff", foreground: "#1a1a1a", accent: "#c9a96e" },
    defaultSettings: {
      theme_color_primary: "#1a1a1a",
      theme_color_primary_dark: "#000000",
      theme_color_primary_light: "#4a4a4a",
      theme_color_secondary: "#999999",
      theme_color_background: "#ffffff",
      theme_color_foreground: "#1a1a1a",
      theme_font_family: "Raleway",
      theme_font_heading_family: "Playfair Display",
      theme_border_radius: "none",
    },
  },
  {
    id: "bold",
    name: "Canli",
    description: "Moda ve genclik markalari icin enerjik tasarim. Canli gradientler, buyuk butonlar.",
    previewColors: { primary: "#8b5cf6", secondary: "#ec4899", background: "#faf5ff", foreground: "#1e1b4b", accent: "#f97316" },
    defaultSettings: {
      theme_color_primary: "#8b5cf6",
      theme_color_primary_dark: "#7c3aed",
      theme_color_primary_light: "#a78bfa",
      theme_color_secondary: "#ec4899",
      theme_color_background: "#faf5ff",
      theme_color_foreground: "#1e1b4b",
      theme_font_family: "Poppins",
      theme_border_radius: "full",
    },
  },
  {
    id: "elegant",
    name: "Zarif",
    description: "Luks urunler icin klasik ve sofistike tasarim. Serif fontlar, altin aksanlar.",
    previewColors: { primary: "#1a1a1a", secondary: "#c9a96e", background: "#fdfcfa", foreground: "#1a1a1a", accent: "#c9a96e" },
    defaultSettings: {
      theme_color_primary: "#1a1a1a",
      theme_color_primary_dark: "#000000",
      theme_color_primary_light: "#4a4a4a",
      theme_color_secondary: "#c9a96e",
      theme_color_background: "#fdfcfa",
      theme_color_foreground: "#1a1a1a",
      theme_font_family: "Lato",
      theme_font_heading_family: "Playfair Display",
      theme_border_radius: "sm",
    },
  },
  {
    id: "tech",
    name: "Teknoloji",
    description: "Elektronik ve teknoloji magazalari icin koyu tema. Neon aksanlar, keskin koseler.",
    previewColors: { primary: "#00d4ff", secondary: "#00ff88", background: "#0a0a0a", foreground: "#e0e0e0", accent: "#00d4ff" },
    defaultSettings: {
      theme_color_primary: "#00d4ff",
      theme_color_primary_dark: "#00a8cc",
      theme_color_primary_light: "#33ddff",
      theme_color_secondary: "#00ff88",
      theme_color_background: "#0a0a0a",
      theme_color_foreground: "#e0e0e0",
      theme_color_muted: "#1a1a2e",
      theme_color_border: "#2a2a3e",
      theme_color_card: "#111122",
      theme_color_card_foreground: "#e0e0e0",
      theme_font_family: "Roboto",
      theme_border_radius: "sm",
    },
  },
  {
    id: "natural",
    name: "Dogal",
    description: "Organik ve saglik urunleri icin dogal tasarim. Toprak tonlari, yuvarlak sekiller.",
    previewColors: { primary: "#2d6a4f", secondary: "#95d5b2", background: "#fefae0", foreground: "#2d2d2d", accent: "#40916c" },
    defaultSettings: {
      theme_color_primary: "#2d6a4f",
      theme_color_primary_dark: "#1b4332",
      theme_color_primary_light: "#40916c",
      theme_color_secondary: "#95d5b2",
      theme_color_background: "#fefae0",
      theme_color_foreground: "#2d2d2d",
      theme_color_muted: "#f4f0e0",
      theme_color_border: "#d4c9a8",
      theme_color_card: "#fffdf5",
      theme_font_family: "Nunito",
      theme_border_radius: "full",
    },
  },
];

// ---- Dynamic Import Map ----

type ThemeLoader = () => Promise<ThemeComponents>;

const THEME_LOADERS: Record<string, ThemeLoader> = {
  default: () => import("./default").then((m) => m.default),
  minimal: () => import("./minimal").then((m) => m.default),
  bold: () => import("./bold").then((m) => m.default),
  elegant: () => import("./elegant").then((m) => m.default),
  tech: () => import("./tech").then((m) => m.default),
  natural: () => import("./natural").then((m) => m.default),
};

export function getThemeLoader(themeId: string): ThemeLoader | null {
  return THEME_LOADERS[themeId] || null;
}

export function getThemeMeta(themeId: string): ThemeMeta | undefined {
  return THEME_LIST.find((t) => t.id === themeId);
}
