import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, newsletterConfirmationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Gecerli bir e-posta adresi girin" }, { status: 400 });
    }

    const existing = await prisma.newsletter.findUnique({ where: { email } });

    if (existing) {
      if (existing.isConfirmed) {
        return NextResponse.json({ message: "Zaten abone olunmus" });
      }
      // Henuz onaylanmamis — yeni token olustur ve tekrar email gonder
      const token = crypto.randomUUID();
      await prisma.newsletter.update({
        where: { email },
        data: { token },
      });

      const emailData = newsletterConfirmationEmail(email, token);
      sendEmail({ to: email, ...emailData }).catch(console.error);

      return NextResponse.json({ message: "Onay e-postasi tekrar gonderildi" });
    }

    // Yeni abonelik
    const token = crypto.randomUUID();
    await prisma.newsletter.create({
      data: { email, token, isConfirmed: false },
    });

    // Onay e-postasi gonder
    const emailData = newsletterConfirmationEmail(email, token);
    sendEmail({ to: email, ...emailData }).catch(console.error);

    return NextResponse.json({ message: "Onay e-postasi gonderildi" });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Bir hata olustu" }, { status: 500 });
  }
}
