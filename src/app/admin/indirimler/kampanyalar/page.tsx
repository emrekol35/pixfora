export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import CampaignList from "./CampaignList";

async function getCampaigns() {
  return prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kampanyalar</h1>
        <Link
          href="/admin/indirimler/kampanyalar/yeni"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          + Yeni Kampanya
        </Link>
      </div>
      <CampaignList campaigns={campaigns.map(c => ({
        ...c,
        startsAt: c.startsAt?.toISOString() || null,
        expiresAt: c.expiresAt?.toISOString() || null,
      }))} />
    </div>
  );
}
