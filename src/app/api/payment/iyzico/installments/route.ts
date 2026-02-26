import { NextRequest, NextResponse } from "next/server";
import { getInstallmentInfo } from "@/services/payment/iyzico";

// POST - Taksit seceneklerini sorgula
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { binNumber, price } = body;

    if (!binNumber || binNumber.length < 6) {
      return NextResponse.json(
        { error: "Kart numarasinin ilk 6 hanesi gerekli" },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: "Gecerli bir tutar giriniz" },
        { status: 400 }
      );
    }

    // Sadece ilk 6 haneyi gonder
    const bin = binNumber.replace(/\D/g, "").substring(0, 6);
    const installments = await getInstallmentInfo(bin, price);

    return NextResponse.json({ installments });
  } catch (error) {
    console.error("Installment info error:", error);
    return NextResponse.json(
      { error: "Taksit bilgisi alinamadi" },
      { status: 500 }
    );
  }
}
