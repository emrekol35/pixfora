export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogPostingSchema, getBreadcrumbSchema } from "@/lib/structured-data";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug, isActive: true },
    include: { category: { select: { name: true, slug: true } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return {};

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      ...(post.image && { images: [{ url: post.image, alt: post.title }] }),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const BASE_URL = process.env.AUTH_URL || "https://pixfora.com";
  const breadcrumbItems = [
    { name: "Anasayfa", url: BASE_URL },
    { name: "Blog", url: `${BASE_URL}/blog` },
    ...(post.category
      ? [{ name: post.category.name, url: `${BASE_URL}/blog` }]
      : []),
    { name: post.title, url: `${BASE_URL}/blog/${slug}` },
  ];

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <JsonLd data={getBlogPostingSchema(post)} />
      <JsonLd data={getBreadcrumbSchema(breadcrumbItems)} />

      <div className="mb-6">
        <Link href="/blog" className="text-sm text-primary hover:underline">
          ← Blog&apos;a Don
        </Link>
      </div>

      {post.image && (
        <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-8">
          <Image src={post.image} alt={post.title} fill className="object-cover" />
        </div>
      )}

      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
        {post.category && (
          <span className="text-primary font-medium">{post.category.name}</span>
        )}
        <span>
          {new Date(post.createdAt).toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold mb-8">{post.title}</h1>

      <div className="prose prose-lg max-w-none">
        {post.content.split("\n").map((paragraph, i) => (
          <p key={i} className="mb-4 text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
