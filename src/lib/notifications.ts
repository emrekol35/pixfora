import { prisma } from "@/lib/db";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
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
  } catch (error) {
    console.error("Bildirim olusturulamadi:", error);
  }
}
