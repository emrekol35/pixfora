"use client";

import { useThemeComponents } from "@/components/storefront/ThemeProvider";

export default function Footer() {
  const { Footer: ThemedFooter } = useThemeComponents();
  return <ThemedFooter />;
}
