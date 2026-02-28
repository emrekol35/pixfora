import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getShippingProvider } from "@/services/shipping";
import { sendEmail, deliveryConfirmationEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";
import type { ShipmentStatus } from "@prisma/client";

// Carrier statusCode -> ShipmentStatus mapping
function mapCarrierStatus(statusCode: string): ShipmentStatus {
  const mapping: Record<string, ShipmentStatus> = {
    PICKED_UP: "PICKED_UP",
    IN_TRANSIT: "IN_TRANSIT",
    TRANSFER: "IN_TRANSIT",
    IN_DELIVERY: "OUT_FOR_DELIVERY",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    RETURNED: "RETURNED",
    FAILED: "FAILED",
    UNDELIVERED: "FAILED",
  };
  return mapping[statusCode] || "IN_TRANSIT";
}

// GET - Kargo durumlarini otomatik guncelle
export async function GET(request: NextRequest) {
  try {
    // Cron secret dogrulama
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    // Otomatik takip aktif mi?
    const autoTrackingSetting = await prisma.setting.findUnique({
      where: { key: "shipping_auto_tracking_enabled" },
    });

    if (autoTrackingSetting?.value !== "true") {
      return NextResponse.json({ message: "Otomatik kargo takibi devre disi", skipped: true });
    }

    // Aktif gonderileri sorgula (terminal durumda olmayanlar)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const activeShipments = await prisma.shipment.findMany({
      where: {
        status: { notIn: ["DELIVERED", "RETURNED", "FAILED"] },
        OR: [
          { lastPolledAt: null },
          { lastPolledAt: { lt: oneHourAgo } },
        ],
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            userId: true,
            guestEmail: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
      take: 50,
      orderBy: { lastPolledAt: { sort: "asc", nulls: "first" } },
    });

    if (activeShipments.length === 0) {
      return NextResponse.json({ message: "Guncellenecek gonderi yok", updated: 0 });
    }

    let updatedCount = 0;
    let deliveredCount = 0;
    const errors: string[] = [];

    for (const shipment of activeShipments) {
      try {
        const provider = getShippingProvider(shipment.provider);
        if (!provider) {
          errors.push(`${shipment.shipmentNumber}: Gecersiz provider ${shipment.provider}`);
          continue;
        }

        const tracking = await provider.getTracking(shipment.trackingNumber);

        if (!tracking.success) {
          // Sadece poll zamanini guncelle, hata durumunda
          await prisma.shipment.update({
            where: { id: shipment.id },
            data: { lastPolledAt: new Date() },
          });
          continue;
        }

        const newStatus = mapCarrierStatus(tracking.statusCode);
        const statusChanged = newStatus !== shipment.status;

        // Shipment guncelle
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            status: newStatus,
            events: tracking.events as object[],
            lastPolledAt: new Date(),
          },
        });

        updatedCount++;

        // DELIVERED olunca: Order guncelle + bildirim + e-posta
        if (newStatus === "DELIVERED" && shipment.order.status !== "DELIVERED") {
          await prisma.order.update({
            where: { id: shipment.order.id },
            data: { status: "DELIVERED" },
          });

          deliveredCount++;

          // E-posta gonder
          const email = shipment.order.user?.email || shipment.order.guestEmail;
          if (email) {
            const emailData = deliveryConfirmationEmail({
              orderNumber: shipment.order.orderNumber,
              deliveryDate: new Date().toLocaleDateString("tr-TR"),
            });
            sendEmail({ to: email, ...emailData }).catch(console.error);
          }

          // Bildirim
          if (shipment.order.userId) {
            createNotification({
              userId: shipment.order.userId,
              title: "Siparisleriniz Teslim Edildi",
              message: `${shipment.order.orderNumber} numarali siparisleriniz teslim edildi.`,
              type: "ORDER",
              pushUrl: `/hesabim/siparislerim/${shipment.order.id}`,
              pushCategory: "orders",
            }).catch(console.error);
          }

          // Activity log
          logActivity({
            action: "auto_deliver",
            entity: "shipment",
            entityId: shipment.id,
            details: {
              orderNumber: shipment.order.orderNumber,
              trackingNumber: shipment.trackingNumber,
              provider: shipment.provider,
            },
          }).catch(console.error);
        } else if (statusChanged) {
          // Diger durum degisikliklerini logla
          logActivity({
            action: "auto_status_update",
            entity: "shipment",
            entityId: shipment.id,
            details: {
              from: shipment.status,
              to: newStatus,
              trackingNumber: shipment.trackingNumber,
            },
          }).catch(console.error);
        }

        // Rate limit: 100ms aralak
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        errors.push(`${shipment.shipmentNumber}: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
      }
    }

    return NextResponse.json({
      message: `${updatedCount} gonderi guncellendi, ${deliveredCount} teslim edildi`,
      total: activeShipments.length,
      updated: updatedCount,
      delivered: deliveredCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Shipping status cron error:", error);
    return NextResponse.json({ error: "Kargo durum guncelleme hatasi" }, { status: 500 });
  }
}
