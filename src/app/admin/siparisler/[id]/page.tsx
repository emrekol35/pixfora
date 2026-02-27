import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import OrderDetail from "./OrderDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { take: 1, orderBy: { order: "asc" } } },
          },
        },
      },
      user: { select: { name: true, email: true, phone: true } },
      shippingAddress: true,
      billingAddress: true,
      payments: true,
      coupon: true,
      returns: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) notFound();

  return (
    <OrderDetail
      order={{
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map((item) => ({
          ...item,
          options: item.options as Record<string, string> | null,
          product: {
            ...item.product,
            images: item.product.images,
          },
        })),
        payments: order.payments.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          providerData: p.providerData as Record<string, unknown> | null,
        })),
        coupon: order.coupon
          ? {
              code: order.coupon.code,
              type: order.coupon.type,
              value: order.coupon.value,
            }
          : null,
        returns: order.returns.map((r) => ({
          id: r.id,
          returnNumber: r.returnNumber,
          status: r.status,
          refundAmount: r.refundAmount,
          createdAt: r.createdAt.toISOString(),
        })),
      }}
    />
  );
}
