"use client";

import { useThemeComponents } from "@/components/storefront/ThemeProvider";

export default function Header() {
  const { Header: ThemedHeader } = useThemeComponents();
  return <ThemedHeader />;
}
