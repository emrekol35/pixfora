import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  pushUrl?: string;
  pushCategory?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
      },
    });

    // Push bildirim gonder (arka planda, hata firlatmaz)
    if (params.pushUrl !== undefined) {
      sendPushToUser(
        params.userId,
        {
          title: params.title,
          body: params.message,
          url: params.pushUrl || "/",
        },
        params.pushCategory
      ).catch(console.error);
    }
  } catch (error) {
    console.error("Bildirim olusturulamadi:", error);
  }
}
