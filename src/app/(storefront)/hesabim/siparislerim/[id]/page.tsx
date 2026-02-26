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
    },
  });

  if (!order || order.userId !== session!.user!.id) notFound();

  const serializedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
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
  };

  return <OrderDetailView order={serializedOrder} />;
}
