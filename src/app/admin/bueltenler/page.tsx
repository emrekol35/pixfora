export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import NewsletterList from "./NewsletterList";

export default async function NewsletterPage() {
  const subscribers = await prisma.newsletter.findMany({ orderBy: { createdAt: "desc" } });
  const totalCount = subscribers.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          E-Bulten Aboneleri{" "}
          <span className="text-base font-normal text-muted-foreground ml-2">
            ({totalCount} abone)
          </span>
        </h1>
      </div>
      <NewsletterList
        subscribers={subscribers.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
