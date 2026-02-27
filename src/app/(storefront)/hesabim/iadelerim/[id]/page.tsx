export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import ReturnDetailView from "./ReturnDetailView";

export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const returnRecord = await prisma.return.findUnique({
    where: { id },
    include: {
      order: { select: { id: true, orderNumber: true, total: true } },
      items: {
        include: {
          orderItem: {
            include: {
              product: {
                select: {
                  name: true,
                  slug: true,
                  images: { take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!returnRecord || returnRecord.userId !== session.user.id) notFound();

  const serialized = {
    id: returnRecord.id,
    returnNumber: returnRecord.returnNumber,
    status: returnRecord.status,
    reason: returnRecord.reason,
    note: returnRecord.note,
    adminNote: returnRecord.adminNote,
    refundAmount: Number(returnRecord.refundAmount),
    refundMethod: returnRecord.refundMethod,
    createdAt: returnRecord.createdAt.toISOString(),
    updatedAt: returnRecord.updatedAt.toISOString(),
    order: {
      id: returnRecord.order.id,
      orderNumber: returnRecord.order.orderNumber,
      total: Number(returnRecord.order.total),
    },
    items: returnRecord.items.map((ri) => ({
      id: ri.id,
      quantity: ri.quantity,
      reason: ri.reason,
      name: ri.orderItem.name || ri.orderItem.product.name,
      price: Number(ri.orderItem.price),
      productSlug: ri.orderItem.product.slug,
      productImage: ri.orderItem.product.images[0]?.url || null,
    })),
  };

  return <ReturnDetailView returnData={serialized} />;
}
