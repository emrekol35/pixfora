export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import CouponList from "./CouponList";

async function getCoupons() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
}

export default async function CouponsPage() {
  const coupons = await getCoupons();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kuponlar</h1>
        <Link
          href="/admin/indirimler/yeni"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          + Yeni Kupon
        </Link>
      </div>
      <CouponList coupons={coupons.map(c => ({
        ...c,
        startsAt: c.startsAt?.toISOString() || null,
        expiresAt: c.expiresAt?.toISOString() || null,
      }))} />
    </div>
  );
}
