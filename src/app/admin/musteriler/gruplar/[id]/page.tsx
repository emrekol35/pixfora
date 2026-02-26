export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import GroupForm from "../GroupForm";

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.userGroup.findUnique({ where: { id } });
  if (!group) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Grup Duzenle</h1>
      <GroupForm group={group} />
    </div>
  );
}
