import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";
import { sendEmail, deliveryConfirmationEmail } from "@/lib/email";

// GET - Shipment detayi
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            orderNumber: true,
            userId: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Gonderi bulunamadi" }, { status: 404 });
    }

    // Admin veya siparis sahibi
    if (
      session.user.role !== "ADMIN" &&
      shipment.order.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error("Shipment get error:", error);
    return NextResponse.json({ error: "Gonderi bilgisi alinamadi" }, { status: 500 });
  }
}

// PUT - Shipment durumunu guncelle (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json({ error: "Durum gerekli" }, { status: 400 });
    }

    const validStatuses = ["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "RETURNED", "FAILED"];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: "Gecersiz durum" }, { status: 400 });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
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
    });

    if (!shipment) {
      return NextResponse.json({ error: "Gonderi bulunamadi" }, { status: 404 });
    }

    const oldStatus = shipment.status;

    // Shipment guncelle + manuel event ekle
    const manualEvent = {
      date: new Date().toISOString(),
      status: newStatus,
      location: "Manuel Guncelleme",
      description: `Durum ${oldStatus} -> ${newStatus} olarak guncellendi`,
    };

    const existingEvents = (shipment.events as object[]) || [];

    await prisma.shipment.update({
      where: { id },
      data: {
        status: newStatus as "CREATED" | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "RETURNED" | "FAILED",
        events: [manualEvent, ...existingEvents],
      },
    });

    // DELIVERED: Order durumunu da guncelle
    if (newStatus === "DELIVERED" && shipment.order.status !== "DELIVERED") {
      await prisma.order.update({
        where: { id: shipment.order.id },
        data: { status: "DELIVERED" },
      });

      // E-posta
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
    }

    // Activity log
    logActivity({
      userId: session.user.id,
      action: "update_status",
      entity: "shipment",
      entityId: id,
      details: {
        from: oldStatus,
        to: newStatus,
        trackingNumber: shipment.trackingNumber,
        orderNumber: shipment.order.orderNumber,
      },
    }).catch(console.error);

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Shipment update error:", error);
    return NextResponse.json({ error: "Gonderi guncelleme hatasi" }, { status: 500 });
  }
}
