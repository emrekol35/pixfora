import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * API route'larinda admin yetkisi kontrolu.
 * auth() ile oturum bilgisini alir, role kontrolu yapar.
 * Role yoksa DB'den fallback kontrol eder.
 */
export async function requireAdmin(): Promise<boolean> {
  try {
    const session = await auth();

    if (!session?.user) return false;

    // Session'da role varsa dogrudan kontrol
    const role = (session.user as { role?: string }).role;
    if (role === "ADMIN") return true;

    // Role yoksa DB'den kontrol (eski oturumlar icin fallback)
    const email = session.user.email;
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { role: true },
      });
      return user?.role === "ADMIN";
    }

    const userId = session.user.id;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      return user?.role === "ADMIN";
    }

    return false;
  } catch (e) {
    console.error("[requireAdmin] Error:", e);
    return false;
  }
}
