export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PostForm from "../PostForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({ where: { id } }),
    prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Blog Yazisi Duzenle</h1>
      <PostForm post={post} categories={categories} />
    </div>
  );
}
