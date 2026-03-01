export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPage(slug: string) {
  return prisma.page.findUnique({
    where: { slug, isActive: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) return {};

  // i18n: SEO çevirileri
  const locale = await getLocale();
  if (locale !== "tr") {
    const { getEntityTranslations } = await import("@/lib/translations");
    const tr = await getEntityTranslations("page", page.id, locale);
    if (tr.title) (page as any).title = tr.title;
  }

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    alternates: { canonical: `/sayfa/${slug}` },
  };
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  // i18n: DB çevirilerini uygula
  const locale = await getLocale();
  if (locale !== "tr") {
    const { getEntityTranslations } = await import("@/lib/translations");
    const tr = await getEntityTranslations("page", page.id, locale);
    if (tr.title) (page as any).title = tr.title;
    if (tr.content) (page as any).content = tr.content;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
      <div className="prose prose-lg max-w-none">
        {page.content.split("\n").map((paragraph, i) => (
          <p key={i} className="mb-4 text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
