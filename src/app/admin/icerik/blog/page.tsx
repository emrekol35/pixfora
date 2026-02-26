export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import PostList from "./PostList";

async function getPosts() {
  return prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
  });
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog Yazilari</h1>
          <Link
            href="/admin/icerik/blog/kategoriler"
            className="text-sm text-primary hover:underline"
          >
            Kategorileri Yonet →
          </Link>
        </div>
        <Link
          href="/admin/icerik/blog/yeni"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          + Yeni Yazi
        </Link>
      </div>
      <PostList posts={posts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))} />
    </div>
  );
}
