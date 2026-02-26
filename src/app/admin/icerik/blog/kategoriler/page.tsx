export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import BlogCategoryManager from "./BlogCategoryManager";

async function getCategories() {
  return prisma.blogCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { posts: true } } },
  });
}

export default async function BlogCategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Blog Kategorileri</h1>
      <BlogCategoryManager categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        order: c.order,
        postCount: c._count.posts,
      }))} />
    </div>
  );
}
