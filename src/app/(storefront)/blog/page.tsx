export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Pixfora",
  description: "En son blog yazilari ve haberler",
};

async function getPosts() {
  return prisma.blogPost.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true, slug: true } } },
    take: 20,
  });
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Henuz blog yazisi yok.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
            >
              {post.image ? (
                <div className="relative h-48 bg-muted">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-4xl">📝</span>
                </div>
              )}
              <div className="p-4">
                {post.category && (
                  <span className="text-xs text-primary font-medium">{post.category.name}</span>
                )}
                <h2 className="text-lg font-semibold mt-1 line-clamp-2">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{post.excerpt}</p>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  {new Date(post.createdAt).toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
