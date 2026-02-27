import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AdminReturnDetail from "./AdminReturnDetail";

export const dynamic = "force-dynamic";

export default async function AdminReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const returnRecord = await prisma.return.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentMethod: true,
          paymentStatus: true,
        },
      },
      user: { select: { name: true, email: true, phone: true } },
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

  if (!returnRecord) notFound();

  // Activity logs for this return
  const activityLogs = await prisma.activityLog.findMany({
    where: { entity: "return", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const serialized = {
    id: returnRecord.id,
    returnNumber: returnRecord.returnNumber,
    status: returnRecord.status,
    reason: returnRecord.reason,
    note: returnRecord.note,
    adminNote: returnRecord.adminNote,
    refundAmount: returnRecord.refundAmount,
    refundMethod: returnRecord.refundMethod,
    createdAt: returnRecord.createdAt.toISOString(),
    updatedAt: returnRecord.updatedAt.toISOString(),
    order: {
      id: returnRecord.order.id,
      orderNumber: returnRecord.order.orderNumber,
      total: returnRecord.order.total,
      paymentMethod: returnRecord.order.paymentMethod,
      paymentStatus: returnRecord.order.paymentStatus,
    },
    user: returnRecord.user,
    items: returnRecord.items.map((ri) => ({
      id: ri.id,
      quantity: ri.quantity,
      reason: ri.reason,
      name: ri.orderItem.name || ri.orderItem.product.name,
      price: ri.orderItem.price,
      productSlug: ri.orderItem.product.slug,
      productImage: ri.orderItem.product.images[0]?.url || null,
    })),
    activityLogs: activityLogs.map((log) => ({
      id: log.id,
      action: log.action,
      details: log.details as Record<string, unknown> | null,
      createdAt: log.createdAt.toISOString(),
    })),
  };

  return <AdminReturnDetail returnData={serialized} />;
}
