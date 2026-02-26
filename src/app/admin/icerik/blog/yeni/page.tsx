export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import PostForm from "../PostForm";

export default async function NewBlogPostPage() {
  const categories = await prisma.blogCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yeni Blog Yazisi</h1>
      <PostForm categories={categories} />
    </div>
  );
}
