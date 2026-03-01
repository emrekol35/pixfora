import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVisitorAssignments } from "@/lib/experiments";

// GET /api/experiments/assign?visitorId=xxx
export async function GET(request: NextRequest) {
  try {
    const visitorId = request.nextUrl.searchParams.get("visitorId");

    if (!visitorId || visitorId.length > 64) {
      return NextResponse.json(
        { error: "visitorId gerekli" },
        { status: 400 }
      );
    }

    // Opsiyonel: giriş yapmış kullanıcı
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.user?.id || null;
    } catch {
      // Anonim devam
    }

    const assignments = await getVisitorAssignments(visitorId, userId);

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Experiment assignment hatasi:", error);
    return NextResponse.json(
      { error: "Atama yapilamadi" },
      { status: 500 }
    );
  }
}
