"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const nextLocale = locale === "tr" ? "en" : "tr";
    startTransition(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(pathname as any, { locale: nextLocale });
    });
  };

  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      className="flex items-center gap-1.5 text-xs font-medium hover:text-primary transition-colors disabled:opacity-50"
      title={locale === "tr" ? "Switch to English" : "Turkce'ye gec"}
    >
      <span className="w-5 h-3.5 inline-flex items-center justify-center rounded-sm overflow-hidden border border-border">
        {locale === "tr" ? (
          // EN flag indicator
          <span className="text-[9px] font-bold leading-none">EN</span>
        ) : (
          // TR flag indicator
          <span className="text-[9px] font-bold leading-none">TR</span>
        )}
      </span>
      <span className="hidden sm:inline">
        {locale === "tr" ? "English" : "Turkce"}
      </span>
    </button>
  );
}
