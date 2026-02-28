import webpush from "web-push";
import { prisma } from "@/lib/db";

// VAPID yapilandirmasi
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:info@pixfora.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

const DEFAULT_ICON = "/icons/icon-192.png";

/**
 * Tek bir push subscription'a bildirim gonder
 * 410 Gone yaniti alirsa subscription'i DB'den siler
 */
async function sendToSubscription(
  subscription: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys not configured, skipping push");
    return false;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || DEFAULT_ICON,
        url: payload.url || "/",
        tag: payload.tag || "pixfora-notification",
      })
    );
    return true;
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    // 404 veya 410: Subscription artik gecerli degil, sil
    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription
        .delete({ where: { id: subscription.id } })
        .catch(() => {});
    }
    return false;
  }
}

/**
 * Bildirim tercihlerini kontrol eden yardimci fonksiyon
 */
async function checkUserPreference(
  userId: string,
  category: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  });

  if (!user?.notificationPreferences) return true; // Default: izin ver

  const prefs = user.notificationPreferences as Record<string, boolean>;
  const key = `push_${category}`;

  // Tercih tanimli degilse default true
  return prefs[key] !== false;
}

/**
 * Belirli bir kullanicinin tum cihazlarina push bildirim gonder
 * category verilirse kullanici tercihlerini kontrol eder
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  category?: string
): Promise<number> {
  // Tercih kontrolu
  if (category) {
    const allowed = await checkUserPreference(userId, category);
    if (!allowed) return 0;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) return 0;

  let sent = 0;
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const ok = await sendToSubscription(sub, payload);
      if (ok) sent++;
    })
  );

  return sent;
}

/**
 * Tum push abonelerine bildirim gonder (broadcast)
 * Buyuk abone sayilarinda batch olarak calisir
 */
export async function broadcastPush(payload: PushPayload): Promise<number> {
  const BATCH_SIZE = 100;
  let sent = 0;
  let skip = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const subscriptions = await prisma.pushSubscription.findMany({
      select: { id: true, endpoint: true, p256dh: true, auth: true },
      take: BATCH_SIZE,
      skip,
    });

    if (subscriptions.length === 0) break;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const ok = await sendToSubscription(sub, payload);
        if (ok) sent++;
      })
    );

    skip += BATCH_SIZE;

    // Tam batch degilse son batch'ti demektir
    if (subscriptions.length < BATCH_SIZE) break;
  }

  return sent;
}
