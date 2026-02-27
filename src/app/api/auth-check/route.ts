import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

// Debug endpoint: Tarayicida /api/auth-check adresini ziyaret ederek
// oturum durumunu kontrol edebilirsiniz.
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    const cookieNames = Array.from(request.cookies.getAll()).map((c) => c.name);

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        message: "Oturum bulunamadi. Lutfen /giris sayfasindan giris yapin.",
        cookies: cookieNames,
        hasSessionCookie: cookieNames.some((c) => c.includes("session-token")),
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: token.email,
        name: token.name,
        role: token.role || "role yok (eski oturum)",
        id: token.sub,
      },
      cookies: cookieNames,
      hasSessionCookie: true,
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
