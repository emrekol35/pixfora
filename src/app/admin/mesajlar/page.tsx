export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import ContactMessageList from "./ContactMessageList";

export default async function MessagesPage() {
  const [messages, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Mesajlar
          {unreadCount > 0 && (
            <span className="ml-2 text-sm bg-danger text-white px-2 py-0.5 rounded-full font-normal">
              {unreadCount} okunmamis
            </span>
          )}
        </h1>
      </div>
      <ContactMessageList
        messages={messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
