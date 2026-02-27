import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

/**
 * API route'larinda admin yetkisi kontrolu.
 * Once JWT token'dan role kontrol eder,
 * bulamazsa DB'den kullanici rolunu dogrular (eski oturumlar icin fallback).
 */
export async function requireAdmin(request: NextRequest): Promise<boolean> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    console.log("[admin-auth] token:", token ? `id=${token.id}, email=${token.email}, role=${token.role}, sub=${token.sub}` : "NULL");

    if (!token) return false;

    // JWT'de role varsa dogrudan kontrol
    if (token.role === "ADMIN") return true;

    // JWT'de role yoksa DB'den kontrol (eski oturumlar icin fallback)
    if (token.email) {
      const user = await prisma.user.findUnique({
        where: { email: token.email as string },
        select: { role: true },
      });
      console.log("[admin-auth] DB lookup by email:", token.email, "=> role:", user?.role);
      return user?.role === "ADMIN";
    }

    if (token.id) {
      const user = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { role: true },
      });
      console.log("[admin-auth] DB lookup by id:", token.id, "=> role:", user?.role);
      return user?.role === "ADMIN";
    }

    console.log("[admin-auth] no email or id in token");
    return false;
  } catch (error) {
    console.error("[admin-auth] error:", error);
    return false;
  }
}
