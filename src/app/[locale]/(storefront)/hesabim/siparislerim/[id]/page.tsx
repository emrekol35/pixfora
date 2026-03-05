export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import OrderDetailView from "@/components/storefront/OrderDetailView";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      shippingAddress: true,
      items: {
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
      returns: {
        where: { status: { notIn: ["CANCELLED", "REJECTED"] } },
        select: { id: true },
        take: 1,
      },
      bankTransferReceipts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order || order.userId !== session!.user!.id) notFound();

  const activeReturn = order.returns[0] || null;

  const serializedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    discount: Number(order.discount),
    total: Number(order.total),
    trackingNumber: order.trackingNumber,
    shippingCompany: order.shippingCompany,
    shippingAddress: order.shippingAddress ? {
      title: order.shippingAddress.title,
      firstName: order.shippingAddress.firstName,
      lastName: order.shippingAddress.lastName,
      phone: order.shippingAddress.phone,
      city: order.shippingAddress.city,
      district: order.shippingAddress.district,
      address: order.shippingAddress.address,
    } : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      productName: item.product.name,
      productSlug: item.product.slug,
      productImage: item.product.images[0]?.url || null,
    })),
    bankTransferReceipts: order.bankTransferReceipts.map((r) => ({
      id: r.id,
      mediaUrl: r.mediaUrl,
      status: r.status,
      adminNote: r.adminNote,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <OrderDetailView
      order={serializedOrder}
      hasActiveReturn={!!activeReturn}
      activeReturnId={activeReturn?.id}
    />
  );
}
