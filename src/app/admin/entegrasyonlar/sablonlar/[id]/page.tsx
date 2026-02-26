export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import TemplateForm from "../TemplateForm";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sablonu Duzenle</h1>
      <TemplateForm
        template={{
          ...template,
          variables: template.variables as string[] | null,
        }}
      />
    </div>
  );
}
