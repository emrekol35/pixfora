import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateInvoicePDF, generateInvoiceNumber } from "@/services/invoice/generator";

// GET - Fatura PDF indir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: true,
        shippingAddress: true,
        invoice: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    // Fatura yoksa olustur
    let invoice = order.invoice;
    if (!invoice) {
      // Kurumsal adres bilgisini shipping address'ten al
      const addr = order.shippingAddress;
      const isCompanyAddr = addr?.isCompany === true;

      invoice = await prisma.invoice.create({
        data: {
          orderId: order.id,
          invoiceNo: generateInvoiceNumber(),
          type: isCompanyAddr ? "e-fatura" : "e-arsiv",
          companyName: isCompanyAddr ? addr?.companyName : null,
          taxOffice: isCompanyAddr ? addr?.taxOffice : null,
          taxNumber: isCompanyAddr ? addr?.taxNumber : null,
          data: {
            orderNumber: order.orderNumber,
            total: order.total,
            createdAt: new Date().toISOString(),
          },
        },
      });
    }

    const customerName = order.user?.name || order.guestName || "Misafir";
    const customerEmail = order.user?.email || order.guestEmail || "-";
    const customerPhone = order.user?.phone || order.guestPhone || "-";

    const pdf = await generateInvoicePDF({
      invoiceNo: invoice.invoiceNo,
      date: new Date(invoice.createdAt).toLocaleDateString("tr-TR"),
      orderNumber: order.orderNumber,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: order.shippingAddress?.address || "-",
        city: order.shippingAddress?.city || "-",
      },
      company: invoice.companyName
        ? {
            name: invoice.companyName,
            taxOffice: invoice.taxOffice || "-",
            taxNumber: invoice.taxNumber || "-",
          }
        : undefined,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.total,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discount: order.discount,
      total: order.total,
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="fatura-${invoice.invoiceNo}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice error:", error);
    return NextResponse.json({ error: "Fatura olusturma hatasi" }, { status: 500 });
  }
}
