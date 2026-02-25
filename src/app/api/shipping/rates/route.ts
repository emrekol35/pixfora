import { NextRequest, NextResponse } from "next/server";
import { getAllRates } from "@/services/shipping";

// GET - Kargo ucretlerini sorgula
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weight = parseFloat(searchParams.get("weight") || "1");
    const desi = parseFloat(searchParams.get("desi") || "1");
    const city = searchParams.get("city") || "Istanbul";

    const rates = await getAllRates(weight, desi, city);

    return NextResponse.json({ rates });
  } catch (error) {
    console.error("Shipping rates error:", error);
    return NextResponse.json({ error: "Kargo ucreti hesaplanamadi" }, { status: 500 });
  }
}
