export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CampaignForm from "../CampaignForm";

async function getCampaign(id: string) {
  return prisma.campaign.findUnique({ where: { id } });
}

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);

  if (!campaign) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kampanya Duzenle</h1>
      <CampaignForm
        campaign={{
          ...campaign,
          conditions: campaign.conditions as Record<string, unknown> | null,
          startsAt: campaign.startsAt?.toISOString() || null,
          expiresAt: campaign.expiresAt?.toISOString() || null,
        }}
      />
    </div>
  );
}
