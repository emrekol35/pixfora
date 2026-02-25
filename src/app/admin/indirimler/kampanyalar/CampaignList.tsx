"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Campaign {
  id: string;
  name: string;
  type: string;
  value: number;
  conditions: unknown;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: "Yuzde",
  FIXED_AMOUNT: "Sabit Tutar",
  FREE_SHIPPING: "Ucretsiz Kargo",
};

function formatValue(type: string, value: number): string {
  if (type === "PERCENTAGE") return `%${value}`;
  if (type === "FIXED_AMOUNT") return `${value.toFixed(2)} TL`;
  return "-";
}

function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR");
}

export default function CampaignList({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();

  async function handleDelete(campaign: Campaign) {
    if (!confirm(`"${campaign.name}" kampanyasini silmek istediginize emin misiniz?`)) return;

    const res = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Silme islemi basarisiz.");
    }
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Henuz kampanya eklenmemis.</p>
        <Link
          href="/admin/indirimler/kampanyalar/yeni"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Ilk kampanyayi olusturun
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Kampanya Adi</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tip</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Deger</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Durum</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Gecerlilik</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Islemler</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{campaign.name}</td>
              <td className="px-4 py-3 text-sm">{TYPE_LABELS[campaign.type] || campaign.type}</td>
              <td className="px-4 py-3 text-sm">{formatValue(campaign.type, campaign.value)}</td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-block w-2 h-2 rounded-full ${campaign.isActive ? "bg-success" : "bg-danger"}`} />
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDate(campaign.startsAt)} - {formatDate(campaign.expiresAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/indirimler/kampanyalar/${campaign.id}`}
                    className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
                  >
                    Duzenle
                  </Link>
                  <button
                    onClick={() => handleDelete(campaign)}
                    className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
