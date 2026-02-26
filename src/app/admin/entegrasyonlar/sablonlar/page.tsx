export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import TemplateList from "./TemplateList";
import Link from "next/link";

export default async function TemplatesPage() {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">E-posta Sablonlari</h1>
        <Link
          href="/admin/entegrasyonlar/sablonlar/yeni"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm transition-colors"
        >
          Yeni Sablon
        </Link>
      </div>
      <TemplateList
        templates={templates.map((t) => ({
          ...t,
          variables: t.variables as string[] | null,
        }))}
      />
    </div>
  );
}
