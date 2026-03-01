export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RETURN_STATUS_LABELS, RETURN_STATUS_COLORS } from "@/lib/return-helpers";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

export default async function ReturnsListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const returns = await prisma.return.findMany({
    where: { userId: session.user.id },
    include: {
      order: { select: { orderNumber: true } },
      items: {
        include: { orderItem: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Iadelerim</h1>

      {returns.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          <p className="text-muted-foreground">Henuz iade talebiniz yok</p>
          <Link
            href="/hesabim/siparislerim"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            Siparislerime Git
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <Link
              key={r.id}
              href={`/hesabim/iadelerim/${r.id}`}
              className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold">{r.returnNumber}</span>
                    <span
                      className={`${RETURN_STATUS_COLORS[r.status] || "bg-muted"} text-white text-xs font-medium px-2 py-0.5 rounded-full`}
                    >
                      {RETURN_STATUS_LABELS[r.status] || r.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Siparis #{r.order.orderNumber} &bull; {formatDate(r.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {r.items.map((i) => `${i.orderItem.name} (${i.quantity})`).join(", ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">
                    {formatCurrency(r.refundAmount)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
