import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Debug endpoint: Tarayicida /api/auth-check adresini ziyaret ederek
// oturum durumunu kontrol edebilirsiniz.
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        message: "Oturum bulunamadi. Lutfen /giris sayfasindan giris yapin.",
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.user.email,
        name: session.user.name,
        role: (session.user as { role?: string }).role || "role yok",
        id: session.user.id,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        authenticated: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
