import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ShipmentDetail from "./ShipmentDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ShipmentDetailPage({ params }: Props) {
  const { id } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: {
                select: { name: true, slug: true, images: { take: 1, orderBy: { order: "asc" } } },
              },
            },
          },
          user: { select: { name: true, email: true, phone: true } },
          shippingAddress: true,
        },
      },
    },
  });

  if (!shipment) notFound();

  const activityLogs = await prisma.activityLog.findMany({
    where: { entity: "shipment", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <ShipmentDetail
      shipment={{
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        provider: shipment.provider,
        trackingNumber: shipment.trackingNumber,
        barcode: shipment.barcode,
        status: shipment.status,
        type: shipment.type,
        senderName: shipment.senderName,
        senderPhone: shipment.senderPhone,
        senderCity: shipment.senderCity,
        senderDistrict: shipment.senderDistrict,
        senderAddress: shipment.senderAddress,
        receiverName: shipment.receiverName,
        receiverPhone: shipment.receiverPhone,
        receiverCity: shipment.receiverCity,
        receiverDistrict: shipment.receiverDistrict,
        receiverAddress: shipment.receiverAddress,
        carrierCost: shipment.carrierCost,
        chargedCost: shipment.chargedCost,
        events: shipment.events as Array<{ date: string; status: string; location: string; description: string }> | null,
        lastPolledAt: shipment.lastPolledAt?.toISOString() || null,
        returnId: shipment.returnId,
        createdAt: shipment.createdAt.toISOString(),
        updatedAt: shipment.updatedAt.toISOString(),
        order: {
          id: shipment.order.id,
          orderNumber: shipment.order.orderNumber,
          customerName: shipment.order.user?.name || shipment.order.guestName || "-",
          customerEmail: shipment.order.user?.email || shipment.order.guestEmail || "",
          customerPhone: shipment.order.user?.phone || shipment.order.shippingAddress?.phone || "",
          items: shipment.order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.product.images[0]?.url || null,
          })),
        },
      }}
      logs={activityLogs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details as Record<string, unknown> | null,
        createdAt: log.createdAt.toISOString(),
      }))}
    />
  );
}
