export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CouponForm from "../CouponForm";

async function getCoupon(id: string) {
  return prisma.coupon.findUnique({ where: { id } });
}

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = await getCoupon(id);

  if (!coupon) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kupon Duzenle</h1>
      <CouponForm
        coupon={{
          ...coupon,
          startsAt: coupon.startsAt?.toISOString() || null,
          expiresAt: coupon.expiresAt?.toISOString() || null,
        }}
      />
    </div>
  );
}
