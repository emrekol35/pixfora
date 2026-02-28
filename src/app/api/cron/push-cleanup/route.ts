import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:info@pixfora.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    let removedCount = 0;
    let checkedCount = 0;
    let skip = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const subscriptions = await prisma.pushSubscription.findMany({
        select: { id: true, endpoint: true, p256dh: true, auth: true },
        take: BATCH_SIZE,
        skip,
      });

      if (subscriptions.length === 0) break;

      for (const sub of subscriptions) {
        checkedCount++;
        try {
          // Bos payload ile test gonder (notification gostermez, sadece gecerliligi test eder)
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title: "", body: "", tag: "ping" }),
            { TTL: 0 } // Hemen gonder, bekletme
          );
        } catch (error: unknown) {
          const statusCode = (error as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription
              .delete({ where: { id: sub.id } })
              .catch(() => {});
            removedCount++;
          }
        }
      }

      skip += BATCH_SIZE;
      if (subscriptions.length < BATCH_SIZE) break;
    }

    return NextResponse.json({
      message: `Push cleanup tamamlandi: ${checkedCount} kontrol, ${removedCount} silindi`,
      checkedCount,
      removedCount,
    });
  } catch (error) {
    console.error("Push cleanup error:", error);
    return NextResponse.json({ error: "Push cleanup hatasi" }, { status: 500 });
  }
}
