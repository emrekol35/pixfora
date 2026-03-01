export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NotificationList from "@/components/storefront/NotificationList";
import { getTranslations } from "next-intl/server";

export default async function NotificationsPage() {
  const session = await auth();
  const t = await getTranslations("account");

  const notifications = await prisma.notification.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("notifications")}</h1>
      <NotificationList
        notifications={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
