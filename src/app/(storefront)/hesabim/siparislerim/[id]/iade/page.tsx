export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { canRequestReturn } from "@/lib/return-helpers";
import ReturnRequestForm from "./ReturnRequestForm";

export default async function ReturnRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
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
        select: { id: true, returnNumber: true },
      },
    },
  });

  if (!order || order.userId !== session.user.id) notFound();

  // Zaten aktif iade var mi
  if (order.returns.length > 0) {
    redirect(`/hesabim/iadelerim/${order.returns[0].id}`);
  }

  // Iade edilebilirlik kontrolu
  const check = canRequestReturn(order);
  if (!check.allowed) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Iade Talebi</h1>
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-6 text-center">
          <p className="text-danger font-medium">{check.reason}</p>
        </div>
      </div>
    );
  }

  const serializedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price),
      total: Number(item.total),
      productSlug: item.product.slug,
      productImage: item.product.images[0]?.url || null,
    })),
  };

  return <ReturnRequestForm order={serializedOrder} />;
}
